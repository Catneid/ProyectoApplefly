import customerModel from "../models/customers.js";

const customersController = {};

customersController.getCustomers = async (req, res) => {
  try {
    const customers = await customerModel.find().select("-password");
    return res.status(200).json(customers);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

customersController.getCustomerById = async (req, res) => {
  try {
    const customer = await customerModel.findById(req.params.id).select("-password");
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    return res.status(200).json(customer);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

customersController.deleteCustomer = async (req, res) => {
  try {
    const deleted = await customerModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Cliente no encontrado" });
    return res.status(200).json({ message: "Cliente eliminado" });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

customersController.countCustomers = async (req, res) => {
  try {
    const count = await customerModel.countDocuments();
    return res.status(200).json({ count });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

export default customersController;
