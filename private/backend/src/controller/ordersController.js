import orderModel from "../models/orders.js";

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

ordersController.createOrder = async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, products, subtotal, shipping, tax, total, address, phone } = req.body;

    const newOrder = new orderModel({
      customerId, customerName, customerEmail,
      products, subtotal, shipping, tax, total,
      address, phone,
      status: "pendiente",
    });

    await newOrder.save();
    return res.status(201).json({ message: "Pedido creado", order: newOrder });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Pedido no encontrado" });
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
