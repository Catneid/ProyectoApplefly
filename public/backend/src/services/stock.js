import mongoose from "mongoose";

import productModel from "../models/products.js";

export class StockInsuficienteError extends Error {
  constructor(productName, disponible) {
    super(`No hay stock suficiente de ${productName}`);
    this.name = "StockInsuficienteError";
    this.productName = productName;
    this.disponible = disponible;
  }
}

// Reserva (descuenta) el stock de cada item de forma atómica: la condición
// `stock >= cantidad` y el descuento ocurren en una sola operación de Mongo,
// así que dos compras simultáneas nunca pueden pasarse del stock (leer con
// findById y descontar después deja una ventana en la que ambas ven stock).
//
// `items`: [{ productId, quantity, name }]. Si algún item no alcanza, devuelve
// lo ya descontado de los anteriores y lanza StockInsuficienteError. Lo mismo
// si falla la base a mitad de camino: nunca queda stock a medio descontar.
//
// Los items se reservan siempre en orden de productId, sin importar el orden
// del carrito. Si no, dos pedidos cruzados ([A, B] y [B, A]) reservan cada
// uno su primer producto, fallan en el segundo y se revierten los dos aunque
// haya stock para uno de ellos. Con un orden fijo compiten por el mismo
// producto primero y uno gana.
//
// Quien reserva es responsable de llamar a liberarStock(items) si algo falla
// después (guardar el pedido, cobrar, etc.).
export const reservarStock = async (items) => {
  const reservados = [];

  try {
    const enOrden = [...items].sort((a, b) =>
      String(a.productId).localeCompare(String(b.productId))
    );

    for (const item of enOrden) {
      const actualizado = await productModel.findOneAndUpdate(
        // trusted(): con sanitizeFilter activo (database.js) los operadores en un
        // filtro se neutralizan salvo que se marquen así. Este es nuestro, no del cliente.
        { _id: item.productId, stock: mongoose.trusted({ $gte: item.quantity }) },
        { $inc: { stock: -item.quantity } }
      );

      if (!actualizado) {
        // Solo informativo (no es atómico con lo anterior): para decirle al
        // cliente cuánto queda realmente.
        const actual = await productModel.findById(item.productId).select("stock").lean();
        throw new StockInsuficienteError(item.name, actual?.stock ?? 0);
      }

      reservados.push(item);
    }
  } catch (error) {
    await liberarStock(reservados);
    throw error;
  }
};

// Devuelve al inventario lo que reservarStock descontó. Nunca lanza: si una
// devolución falla se registra en el log y se sigue con las demás, para no
// dejar el resto sin devolver.
export const liberarStock = async (items) => {
  for (const item of items) {
    try {
      await productModel.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
    } catch (error) {
      console.log(
        `No se pudo devolver el stock de ${item.productId} (${item.quantity} u.), revisar a mano:`,
        error.message
      );
    }
  }
};
