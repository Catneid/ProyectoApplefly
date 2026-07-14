import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

// Este backend es solo para clientes, así que aquí no hay verifyAdmin.
// Deja pasar únicamente a quien tenga una sesión de cliente válida.
export const verifyToken = (req, res, next) => {
  const token = req.cookies.authCookie;
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (decoded.userType !== "customer") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};
