import { Schema, model } from "mongoose";

// Intentos fallidos por código de verificación (registro o recuperación).
// Vive en la base y no en el token porque el cliente controla su cookie:
// si el contador fuera dentro del JWT, bastaría con reenviar la cookie
// original para volver a tener 0 intentos. `jti` es el id único del código.
// `consumed` marca un token de un solo uso (ver consumeCode). El registro se
// borra solo cuando el token expira (índice TTL).
const codeAttemptSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
  consumed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default model("CodeAttempts", codeAttemptSchema);
