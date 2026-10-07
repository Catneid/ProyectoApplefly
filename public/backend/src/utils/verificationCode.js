import crypto from "crypto";
import mongoose from "mongoose";
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
    { upsert: true, returnDocument: "after" }
  );
  return doc.attempts;
};

// Marca un token como usado, de forma atómica. Devuelve true la primera vez y
// false si ya se había usado. Sirve para tokens de un solo uso: si no, quien
// copie la cookie podría reutilizarla hasta que expire.
//
// Con upsert: si el jti ya está consumido, el filtro no lo encuentra, Mongo
// intenta insertarlo y choca con el índice único (E11000) — eso es "ya usado".
export const consumeCode = async (jti, expSeconds) => {
  try {
    await codeAttemptModel.findOneAndUpdate(
      { jti, consumed: mongoose.trusted({ $ne: true }) },
      { $set: { consumed: true }, $setOnInsert: { expiresAt: new Date(expSeconds * 1000) } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};
