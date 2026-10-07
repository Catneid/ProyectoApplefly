import mongoose from "mongoose";
import orderModel from "../models/orders.js";
import { notificarCambioEstado } from "../services/notificaciones.js";
import { devolverStockDePedido } from "../services/inventario.js";

const ordersController = {};

ordersController.getOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.getOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
    return res.status(200).json(order);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (typeof status !== "string" || !orderModel.schema.path("status").enumValues.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const anterior = await orderModel.findById(id);
    if (!anterior) return res.status(404).json({ message: "Pedido no encontrado" });

    // Sin cambios: ni push ni stock
    if (anterior.status === status) {
      return res.status(200).json({ message: "Estado actualizado", order: anterior });
    }

    // Un pedido cancelado ya devolvió su stock; reactivarlo lo dejaría "vivo"
    // sin stock reservado. Si hay que rehacerlo, se crea un pedido nuevo.
    if (anterior.status === "cancelado") {
      return res.status(400).json({ message: "Un pedido cancelado no se puede reactivar" });
    }

    const cancelando = status === "cancelado";

    // El cambio de estado y la marca de "stock devuelto" son UNA sola
    // operación, y solo ocurre si el pedido todavía no está cancelado: si dos
    // peticiones cancelan a la vez, solo una gana y solo ella devuelve el stock.
    const antes = await orderModel.findOneAndUpdate(
      { _id: id, status: mongoose.trusted({ $ne: "cancelado" }) },
      cancelando ? { status, stockDevuelto: true } : { status },
      { returnDocument: "before" }
    );

    if (!antes) {
      // Otra petición lo canceló justo antes que esta
      const actual = await orderModel.findById(id);
      if (cancelando && actual?.status === "cancelado") {
        return res.status(200).json({ message: "Estado actualizado", order: actual });
      }
      return res.status(400).json({ message: "Un pedido cancelado no se puede reactivar" });
    }

    if (cancelando && !antes.stockDevuelto) await devolverStockDePedido(antes);

    const updated = await orderModel.findById(id);

    // Sin await: el panel no tiene que esperar a Firebase ni a Expo, y
    // notificarCambioEstado nunca tira.
    notificarCambioEstado(updated);

    return res.status(200).json({ message: "Estado actualizado", order: updated });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.deleteOrder = async (req, res) => {
  try {
    const deleted = await orderModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Pedido no encontrado" });
    return res.status(200).json({ message: "Pedido eliminado" });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.countOrders = async (req, res) => {
  try {
    const count = await orderModel.countDocuments();
    return res.status(200).json({ count });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

export default ordersController;
