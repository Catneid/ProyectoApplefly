import { Schema, model } from "mongoose";

// Una fila por cada código de recuperación pedido para un correo, para limitar
// cuántos se pueden pedir por hora (ver recoveryPasswordController). Se guarda
// en Mongo y no en memoria para que el límite valga aunque haya varias
// instancias del servidor o se reinicie. El índice TTL borra cada fila a la
// hora de haberse creado.
const recoveryRequestSchema = new Schema({
  // Siempre en minúsculas: "Ana@x.com" y "ana@x.com" cuentan como el mismo correo
  email: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: { expires: 60 * 60 } },
});

export default model("RecoveryRequests", recoveryRequestSchema);
