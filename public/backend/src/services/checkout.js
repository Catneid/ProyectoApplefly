import mongoose from "mongoose";

import orderModel from "../models/orders.js";
import productModel from "../models/products.js";
import { reservarStock, liberarStock } from "./stock.js";
import { procesarCobroWompi, WompiHttpError } from "./wompiPagos.js";
import { calcularTotales } from "../utils/precios.js";
import { leerTarjeta, texto } from "../utils/validaciones.js";

const MAX_ITEMS = 50;

// Error "esperado" del checkout, con el status HTTP con el que hay que
// responderle al cliente. Lo que no sea CheckoutError ni StockInsuficienteError
// es un fallo inesperado (500).
export class CheckoutError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
    this.extra = extra;
  }
}

// Del carrito solo se acepta QUÉ producto y CUÁNTOS. Cualquier precio,
// subtotal o total que mande el cliente se ignora.
const leerItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null;

  const limpios = [];
  for (const item of items) {
    const idValido = typeof item?.productId === "string" && mongoose.isValidObjectId(item.productId);
    if (!idValido || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return null;
    limpios.push({ productId: item.productId, quantity: item.quantity });
  }
  return limpios;
};

// Lee cada producto de Mongo y calcula subtotal, envío, IVA y total. No mira
// el stock: eso lo hace reservarStock, de forma atómica.
export const calcularPedido = async (items) => {
  let subtotal = 0;
  const productos = [];

  for (const item of items) {
    const producto = await productModel.findById(item.productId);

    if (!producto || typeof producto.price !== "number" || !(producto.price > 0)) {
      throw new CheckoutError(400, "Uno de los productos ya no está disponible");
    }

    const subtotalItem = producto.price * item.quantity;
    subtotal += subtotalItem;

    productos.push({
      productId: producto._id,
      name: producto.name,
      price: producto.price,
      quantity: item.quantity,
      subtotal: subtotalItem,
    });
  }

  return { productos, ...calcularTotales(subtotal) };
};

// El único camino para crear un pedido pagado (lo usan la web y la app):
//   1. calcula el total desde Mongo,
//   2. reserva el stock (atómico),
//   3. cobra ese total con Wompi,
//   4. si Wompi rechaza, devuelve el stock (402),
//   5. si aprueba, guarda el pedido con el pago aprobado.
// Nada del dinero viene del cliente.
//
// `user` es req.user (sesión ya verificada). Devuelve el pedido guardado.
export const procesarCheckout = async ({ user, customerName, products, address, phone, tarjeta }) => {
  const items = leerItems(products);
  if (!items) throw new CheckoutError(400, "El carrito no tiene productos válidos");

  const tarjetaValida = leerTarjeta(tarjeta);
  if (!tarjetaValida) throw new CheckoutError(400, "Los datos de la tarjeta no son válidos");

  const direccion = texto(address, 300);
  const telefono = texto(phone, 30);
  if (!direccion || !telefono) throw new CheckoutError(400, "Faltan los datos de envío");

  const nombre = texto(customerName, 100) || user.name || user.email;

  const calculado = await calcularPedido(items);

  // Si no alcanza el stock lanza StockInsuficienteError (409), ya revertido
  await reservarStock(calculado.productos);

  let cobro;
  try {
    cobro = await procesarCobroWompi({
      monto: calculado.total,
      nombreCliente: nombre,
      emailCliente: user.email,
      tarjeta: tarjetaValida,
    });
  } catch (error) {
    await liberarStock(calculado.productos);

    // Nunca se reenvía al cliente el texto crudo de Wompi, solo mensajes
    // pensados para mostrarse.
    if (error instanceof WompiHttpError) {
      console.log("[checkout] Wompi respondió con error:", error.wompiRaw);
      throw new CheckoutError(402, "No se pudo procesar el pago, revisa los datos de la tarjeta");
    }
    throw new CheckoutError(402, error.message || "El pago fue rechazado");
  }

  const pedido = new orderModel({
    customerId: user.id,
    customerName: nombre,
    customerEmail: user.email,
    products: calculado.productos,
    subtotal: calculado.subtotal,
    shipping: calculado.shipping,
    tax: calculado.tax,
    total: calculado.total,
    address: direccion,
    phone: telefono,
    payment: {
      method: "wompi",
      transactionId: cobro.idTransaccion,
      status: "aprobado",
      cardLast4: cobro.cardLast4,
    },
    status: "pendiente",
  });

  try {
    await pedido.save();
  } catch (error) {
    // Lo peor que puede pasar: Wompi ya cobró y el pedido no quedó guardado.
    // Se devuelve el stock y queda todo en el log para reembolsar a mano (no
    // hay anulación automática de cobros).
    console.log(
      `[checkout] CRÍTICO: cobro aprobado (transactionId ${cobro.idTransaccion}, $${calculado.total}, cliente ${user.id}) pero no se pudo guardar el pedido:`,
      error
    );
    await liberarStock(calculado.productos);
    throw new CheckoutError(
      500,
      `Tu pago fue aprobado pero no pudimos registrar el pedido. Contáctanos con este número de transacción: ${cobro.idTransaccion}`,
      { transactionId: cobro.idTransaccion }
    );
  }

  return pedido;
};
