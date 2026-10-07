import orderModel from "../models/orders.js";
import { StockInsuficienteError } from "../services/stock.js";
import { CheckoutError, procesarCheckout } from "../services/checkout.js";

const ordersController = {};

// Único camino para crear un pedido: valida, reserva stock, cobra con Wompi y
// guarda el pedido (ver services/checkout.js). Del body solo se usa QUÉ se
// compra, a dónde va y la tarjeta; el dinero lo calcula el servidor.
ordersController.checkout = async (req, res) => {
  try {
    const { products, address, phone, tarjeta, customerName } = req.body;

    const order = await procesarCheckout({
      user: req.user,
      customerName,
      products,
      address,
      phone,
      tarjeta,
    });

    return res.status(201).json({ message: "Pedido creado", order });
  } catch (error) {
    if (error instanceof StockInsuficienteError) {
      return res.status(409).json({
        message: `${error.message} (disponibles: ${error.disponible})`,
        product: error.productName,
        available: error.disponible,
      });
    }

    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message, ...error.extra });
    }

    console.log(error);
    return res.status(500).json({ message: "No se pudo procesar el pedido" });
  }
};


ordersController.getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ customerId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.getMyOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }


    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default ordersController;
