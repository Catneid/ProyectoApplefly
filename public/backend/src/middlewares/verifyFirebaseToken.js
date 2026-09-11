import { getFirebaseAuth } from "../config/firebaseAdmin.js";

// Verifica el ID token de Firebase que manda la app mobile (header
// Authorization: Bearer <token>) y deja el uid ya verificado en
// req.uidApp. Distinto de verifyToken.js: ese es para la sesión clásica
// por cookie de la web, este es para Firebase Auth.
export const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Falta el token de sesión" });
  }

  let auth;
  try {
    auth = getFirebaseAuth();
  } catch (error) {
    console.log("Firebase Admin no está configurado:", error.message);
    return res.status(500).json({ message: "Verificación de sesión no disponible" });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uidApp = decoded.uid;
    // El correo ya verificado por Firebase, para no depender nunca del que
    // mande el body (por ejemplo, al armar un pedido o mandar una notificación).
    req.emailApp = decoded.email || null;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
