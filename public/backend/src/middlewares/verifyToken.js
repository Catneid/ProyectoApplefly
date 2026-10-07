import bcrypt from "bcryptjs";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";
import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import customerModel from "../models/customers.js";

// Mismo criterio de mayúsculas que Firebase (que guarda los correos en
// minúsculas) sin tocar lo que ya está guardado en Mongo.
const porCorreo = (email) => customerModel.findOne({ email }).collation({ locale: "en", strength: 2 });

const esDuplicado = (error) => error?.code === 11000;

// Traduce un ID token de Firebase (app mobile) al cliente de Mongo, que es la
// única fuente de verdad. Devuelve el cliente, o { error: { status, message } }.
//
//  1. Por firebaseUid (el caso normal una vez vinculado).
//  2. Si no está vinculado todavía, por correo, PERO solo si Firebase confirma
//     que ese correo es de quien tiene el token (email_verified). Firebase deja
//     crear cuentas con cualquier correo sin verificarlo; sin esta condición,
//     alguien podría registrar en Firebase el correo de otra persona y
//     quedarse con su cuenta, sus pedidos y su perfil.
//  3. Si no existe ningún cliente con ese correo, se crea (también exige correo
//     verificado, para no dejar correos ajenos "reservados").
const clienteDesdeFirebase = async (decoded) => {
  const { uid, email, email_verified: correoVerificado } = decoded;

  const vinculado = await customerModel.findOne({ firebaseUid: uid });
  if (vinculado) return vinculado;

  if (!email || !correoVerificado) {
    return {
      error: { status: 403, message: "Verifica tu correo para continuar" },
    };
  }

  const existente = await porCorreo(email);

  if (existente) {
    if (existente.firebaseUid && existente.firebaseUid !== uid) {
      return {
        error: { status: 403, message: "Este correo ya está vinculado a otra cuenta" },
      };
    }

    // Solo se vincula si sigue sin uid (condición dentro de la misma operación,
    // por si dos peticiones llegan a la vez).
    try {
      const vinculada = await customerModel.findOneAndUpdate(
        { _id: existente._id, firebaseUid: { $exists: false } },
        { firebaseUid: uid },
        { returnDocument: "after" }
      );
      if (vinculada) return vinculada;
    } catch (error) {
      if (!esDuplicado(error)) throw error;
    }

    return (await customerModel.findOne({ firebaseUid: uid })) ?? {
      error: { status: 403, message: "Este correo ya está vinculado a otra cuenta" },
    };
  }

  try {
    return await customerModel.create({
      // El token de Firebase casi nunca trae nombre. No se usa el correo: el
      // nombre aparece en reseñas públicas y no debe filtrar parte del correo.
      // Cambia cuando el cliente guarda su perfil (PUT /profile).
      name: decoded.name || "Cliente",
      email,
      // Sin contraseña real: un hash de bytes aleatorios que nadie conoce.
      // Así el login de la web responde "contraseña incorrecta" (en vez de
      // fallar), y la persona entra con "recuperar contraseña" si la quiere.
      password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      isVerified: true,
      loginAttemps: 0,
      firebaseUid: uid,
    });
  } catch (error) {
    // Dos primeras peticiones simultáneas del mismo cliente: la otra ya lo creó
    if (esDuplicado(error)) {
      const creado = await customerModel.findOne({ firebaseUid: uid });
      if (creado) return creado;
    }
    throw error;
  }
};

// Este backend es solo para clientes, así que aquí no hay verifyAdmin.
// Deja pasar únicamente a quien tenga una sesión de cliente válida, ya sea:
//   - la cookie authCookie (web), o
//   - Authorization: Bearer <ID token de Firebase> (app mobile).
// Si llegan las dos, manda el Bearer. En ambos casos deja en req.user la misma
// forma ({ id, userType, name, email }), así que el resto de los controladores
// no sabe de dónde vino la sesión.
export const verifyToken = async (req, res, next) => {
  const cabecera = req.headers.authorization || "";

  if (cabecera.startsWith("Bearer ")) {
    let decoded;
    try {
      decoded = await getFirebaseAuth().verifyIdToken(cabecera.slice(7));
    } catch (error) {
      // Firebase Admin sin configurar (falta la clave de servicio) no es
      // culpa del cliente: distinguirlo de un token malo.
      if (error?.code === "ENOENT" || error instanceof SyntaxError) {
        console.log("Firebase Admin no está configurado:", error.message);
        return res.status(500).json({ message: "Verificación de sesión no disponible" });
      }
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    try {
      const cliente = await clienteDesdeFirebase(decoded);
      if (cliente.error) {
        return res.status(cliente.error.status).json({ message: cliente.error.message });
      }

      req.user = {
        id: String(cliente._id),
        userType: "customer",
        name: cliente.name,
        email: cliente.email,
        firebaseUid: cliente.firebaseUid,
      };
      return next();
    } catch (error) {
      console.log("No se pudo resolver el cliente desde Firebase:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  }

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
