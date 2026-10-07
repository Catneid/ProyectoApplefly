import { StockInsuficienteError } from "../services/stock.js";
import { CheckoutError, procesarCheckout } from "../services/checkout.js";

const wompiAppController = {};

/**
 * Ruta que la app mobile ya usaba para pagar, ahora sobre MongoDB: es la
 * MISMA lógica que POST /orders/checkout (services/checkout.js), solo con la
 * forma de body y de respuesta que la app conocía (`items`, `aprobada`,
 * `mensaje`).
 *
 * Del body solo se usa QUÉ se compra (items: productId + quantity), a dónde
 * va y la tarjeta. Precios, envío, IVA y total los calcula el servidor; el
 * pedido se crea en Mongo, así que aparece en el panel de administración.
 */
wompiAppController.cobrar = async (req, res) => {
  try {
    const { items, address, phone, tarjeta, customerName } = req.body;

    const order = await procesarCheckout({
      user: req.user,
      customerName,
      products: items,
      address,
      phone,
      tarjeta,
    });

    return res.status(201).json({
      orderId: order._id,
      aprobada: true,
      mensaje: "Pago aprobado",
      cardLast4: order.payment.cardLast4,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      products: order.products,
    });
  } catch (error) {
    if (error instanceof StockInsuficienteError) {
      return res.status(409).json({
        message: `${error.message} (disponibles: ${error.disponible})`,
        product: error.productName,
        available: error.disponible,
      });
    }

    if (error instanceof CheckoutError) {
      return res.status(error.status).json({
        message: error.message,
        ...(error.status === 402 && { aprobada: false, mensaje: error.message }),
        ...error.extra,
      });
    }

    console.log("[wompiApp.cobrar] error inesperado:", error);
    return res.status(500).json({ message: "No se pudo procesar el pedido" });
  }
};

export default wompiAppController;
