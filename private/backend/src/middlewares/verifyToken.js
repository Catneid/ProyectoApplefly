import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";
import employeeModel from "../models/employees.js";

// Este backend es solo del panel de administración. verifyAdmin solo
// comprueba que haya una sesión válida del panel (cualquier empleado,
// sea cual sea su role); "userType: admin" en el token significa "token
// del panel", no "role admin". Las sesiones de cliente las valida
// public/backend con su propio middleware.
export const verifyAdmin = (req, res, next) => {
  const token = req.cookies.adminAuthCookie;
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (decoded.userType !== "admin") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// Se usa después de verifyAdmin. El role se consulta en la base de datos y
// no se toma del token, para que un empleado eliminado o degradado pierda
// el permiso de inmediato y no hasta que expire su token (8h).
export const requireRole = (...roles) => async (req, res, next) => {
  try {
    const employee = await employeeModel.findById(req.user.id).select("role");

    if (!employee || !roles.includes(employee.role)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};
