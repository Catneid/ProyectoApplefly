import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.authCookie;
  if (!token) return res.status(401).json({ message: "No autorizado" });
  try {
    req.user = jsonwebtoken.verify(token, config.JWT.secret);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};

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
