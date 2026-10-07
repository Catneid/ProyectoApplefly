import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { config } from "../../config.js";
import codeAttemptModel from "../models/codeAttempts.js";

export const MAX_ATTEMPTS = 5;

// Código numérico de 6 dígitos (con ceros a la izquierda), con aleatoriedad
// criptográfica y sin sesgo de módulo.
export const generateCode = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const newCodeId = () => crypto.randomUUID();

// El JWT viaja en una cookie y cualquiera puede leer su contenido. Con solo
// 1.000.000 de códigos posibles, un hash bcrypt "a secas" se podría romper
// fuera de línea probándolos todos. Por eso primero se firma el código con
// HMAC usando la clave del servidor (que el atacante no tiene) y a ese
// resultado se le aplica bcrypt.
const pepper = (code) =>
  crypto.createHmac("sha256", config.JWT.secret).update(code).digest("base64");

export const hashCode = (code) => bcryptjs.hash(pepper(code), 10);

export const compareCode = (code, hash) =>
  typeof code === "string" && /^\d{6}$/.test(code)
    ? bcryptjs.compare(pepper(code), hash)
    : Promise.resolve(false);

// Cuenta el intento ANTES de comparar y de forma atómica ($inc), así que
// aunque lleguen 100 peticiones en paralelo solo las primeras 5 se comparan.
// Devuelve cuántos intentos van (contando este).
export const registerAttempt = async (jti, expSeconds) => {
  const doc = await codeAttemptModel.findOneAndUpdate(
    { jti },
    { $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date(expSeconds * 1000) } },
    { upsert: true, new: true }
  );
  return doc.attempts;
};
