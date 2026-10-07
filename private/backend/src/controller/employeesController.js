import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import employeeModel from "../models/employees.js";
import { esCorreo } from "../utils/validaciones.js";

const employeesController = {};

const ROLES = ["admin", "empleado"];
const PASSWORD_MIN = 6;

const esDuplicado = (error) => error?.code === 11000;

// "" / null / undefined = el campo no vino (un formulario vacío manda "")
const vino = (valor) => valor !== undefined && valor !== null && valor !== "";

// Salario: número finito >= 0, o null si no es válido
const leerSalario = (valor) => {
  const numero = typeof valor === "number" ? valor : Number(String(valor).trim());
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
};

// ¿Ya hay otro empleado con ese correo? Sin distinguir mayúsculas (el índice
// único de Mongo sí las distingue, y "Ana@x.com" / "ana@x.com" serían dos).
const correoEnUso = (email, exceptoId) =>
  employeeModel
    .findOne({ email, ...(exceptoId && { _id: mongoose.trusted({ $ne: exceptoId }) }) })
    .collation({ locale: "en", strength: 2 });

const cuantosAdmins = () => employeeModel.countDocuments({ role: "admin" });

// Valida y normaliza los campos que llegaron. Devuelve { campos } o { error }.
// Solo incluye lo que vino: así al editar no se pisa con undefined / 0 lo que
// el formulario no mandó.
const leerCampos = (body) => {
  const campos = {};

  for (const clave of ["name", "lastName"]) {
    if (body[clave] === undefined) continue;
    if (typeof body[clave] !== "string" || !body[clave].trim()) {
      return { error: `El campo ${clave === "name" ? "nombre" : "apellido"} no es válido` };
    }
    campos[clave] = body[clave].trim();
  }

  // DUI y teléfono pueden quedar vacíos a propósito ("" los limpia)
  for (const clave of ["DUI", "phone"]) {
    if (body[clave] === undefined || body[clave] === null) continue;
    if (typeof body[clave] !== "string") return { error: `El campo ${clave} no es válido` };
    campos[clave] = body[clave].trim();
  }

  if (body.email !== undefined) {
    if (!esCorreo(body.email)) return { error: "Correo inválido" };
    campos.email = body.email;
  }

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return { error: 'El rol debe ser "admin" o "empleado"' };
    campos.role = body.role;
  }

  if (vino(body.salary)) {
    const salario = leerSalario(body.salary);
    if (salario === null) return { error: "El salario debe ser un número mayor o igual a 0" };
    campos.salary = salario;
  }

  return { campos };
};

const leerPassword = (valor) => {
  if (typeof valor !== "string" || valor.length < PASSWORD_MIN) {
    return { error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` };
  }
  return { password: valor };
};

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
    const { campos, error } = leerCampos(req.body);
    if (error) return res.status(400).json({ message: error });

    if (!campos.name || !campos.lastName || !campos.email) {
      return res.status(400).json({ message: "Nombre, apellido y correo son requeridos" });
    }

    const { password, error: errorPassword } = leerPassword(req.body.password);
    if (errorPassword) return res.status(400).json({ message: errorPassword });

    if (await correoEnUso(campos.email)) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const newEmployee = new employeeModel({
      ...campos,
      // Al crear, un salario omitido es 0 (no hay valor anterior que conservar)
      salary: campos.salary ?? 0,
      role: campos.role ?? "empleado",
      password: await bcryptjs.hash(password, 10),
    });

    await newEmployee.save();
    const { password: _, ...employeeData } = newEmployee.toObject();
    return res.status(201).json({ message: "Empleado registrado", employee: employeeData });
  } catch (error) {
    if (esDuplicado(error)) return res.status(400).json({ message: "El correo ya está registrado" });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

employeesController.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const objetivo = await employeeModel.findById(id).select("role");
    if (!objetivo) return res.status(404).json({ message: "Empleado no encontrado" });

    const { campos, error } = leerCampos(req.body);
    if (error) return res.status(400).json({ message: error });

    // La contraseña es opcional al editar: vacía = no cambiarla
    if (vino(req.body.password)) {
      const { password, error: errorPassword } = leerPassword(req.body.password);
      if (errorPassword) return res.status(400).json({ message: errorPassword });
      campos.password = await bcryptjs.hash(password, 10);
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ message: "No hay ningún cambio que guardar" });
    }

    const esUnoMismo = String(req.user.id) === id;
    const dejaDeSerAdmin = objetivo.role === "admin" && campos.role !== undefined && campos.role !== "admin";

    if (dejaDeSerAdmin) {
      if (esUnoMismo) {
        return res.status(400).json({ message: "No puedes quitarte a ti mismo el rol de admin" });
      }
      if ((await cuantosAdmins()) <= 1) {
        return res.status(400).json({ message: "No se puede degradar al último admin" });
      }
    }

    if (campos.email !== undefined && (await correoEnUso(campos.email, id))) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const updated = await employeeModel
      .findByIdAndUpdate(id, { $set: campos }, { returnDocument: "after", runValidators: true })
      .select("-password");
    if (!updated) return res.status(404).json({ message: "Empleado no encontrado" });

    // Dos admins que se degraden a la vez pasan los dos la revisión de arriba
    // (cada uno ve al otro como admin). Si de verdad no queda ninguno, se revierte.
    if (dejaDeSerAdmin && (await cuantosAdmins()) === 0) {
      await employeeModel.updateOne({ _id: id }, { role: "admin" });
      return res.status(400).json({ message: "No se puede degradar al último admin" });
    }

    return res.status(200).json({ message: "Empleado actualizado", employee: updated });
  } catch (error) {
    if (esDuplicado(error)) return res.status(400).json({ message: "El correo ya está registrado" });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

employeesController.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user.id) === id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }

    const objetivo = await employeeModel.findById(id).select("role");
    if (!objetivo) return res.status(404).json({ message: "Empleado no encontrado" });

    const eraAdmin = objetivo.role === "admin";
    if (eraAdmin && (await cuantosAdmins()) <= 1) {
      return res.status(400).json({ message: "No se puede eliminar al último admin" });
    }

    const deleted = await employeeModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Empleado no encontrado" });

    // Mismo caso de carrera que en updateEmployee: si no queda ningún admin, se restituye
    if (eraAdmin && (await cuantosAdmins()) === 0) {
      await new employeeModel(deleted.toObject()).save();
      return res.status(400).json({ message: "No se puede eliminar al último admin" });
    }

    return res.status(200).json({ message: "Empleado eliminado" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default employeesController;
