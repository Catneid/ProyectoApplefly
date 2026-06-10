import bcryptjs from "bcryptjs";
import employeeModel from "../models/employees.js";

const employeesController = {};

employeesController.getEmployees = async (req, res) => {
  try {
    const employees = await employeeModel.find().select("-password");
    return res.status(200).json(employees);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

employeesController.insertEmployee = async (req, res) => {
  try {
    const { name, lastName, salary, DUI, phone, email, password, role } = req.body;

    const exists = await employeeModel.findOne({ email });
    if (exists) return res.status(400).json({ message: "El correo ya está registrado" });

    const passwordHash = await bcryptjs.hash(password, 10);

    const newEmployee = new employeeModel({
      name, lastName, salary: parseFloat(salary) || 0,
      DUI, phone, email,
      password: passwordHash,
      role: role || "empleado",
    });

    await newEmployee.save();
    const { password: _, ...employeeData } = newEmployee.toObject();
    return res.status(201).json({ message: "Empleado registrado", employee: employeeData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

employeesController.updateEmployee = async (req, res) => {
  try {
    const { name, lastName, salary, DUI, phone, email, role, password } = req.body;
    const updateData = { name, lastName, salary: parseFloat(salary) || 0, DUI, phone, email, role };

    if (password && password.trim()) {
      updateData.password = await bcryptjs.hash(password, 10);
    }

    const updated = await employeeModel.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "Empleado no encontrado" });

    return res.status(200).json({ message: "Empleado actualizado", employee: updated });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

employeesController.deleteEmployee = async (req, res) => {
  try {
    const deleted = await employeeModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Empleado no encontrado" });
    return res.status(200).json({ message: "Empleado eliminado" });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

export default employeesController;
