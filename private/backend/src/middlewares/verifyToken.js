import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

// Este backend es solo del panel de administración, así que la única
// puerta que hace falta es la del admin. Las sesiones de cliente las
// valida public/backend con su propio middleware.
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
