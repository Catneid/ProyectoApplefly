import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import employeeModel from "../models/employees.js";
import { config } from "../../config.js";

const loginAdminController = {};

loginAdminController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await employeeModel.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jsonwebtoken.sign(
      { id: employee._id, userType: "admin", name: employee.name, email: employee.email, role: employee.role },
      config.JWT.secret,
      { expiresIn: "8h" }
    );

    res.cookie("adminAuthCookie", token, {
      maxAge: 8 * 60 * 60 * 1000,
      httpOnly: false,
    });

    return res.status(200).json({
      message: "Login admin exitoso",
      user: { id: employee._id, name: employee.name, email: employee.email, role: employee.role },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

loginAdminController.verify = (req, res) => {
  return res.status(200).json({ user: req.user });
};

export default loginAdminController;
