// Claim "typ" de cada JWT que firma este backend. Todos se firman con el mismo
// secreto, así que sin esto un token de un flujo sirve en otro: por ejemplo,
// copiar el valor de recoveryCookie a authCookie lo haría pasar por una sesión
// (incluso de un correo que ni existe). Cada lugar que verifica un token exige
// el typ que le corresponde.
export const TOKEN_TYP = {
  SESSION: "session", // authCookie: sesión de un cliente
  VERIFY_EMAIL: "verify-email", // verificationToken: registro pendiente de verificar
  RECOVERY: "recovery", // recoveryCookie: recuperación de contraseña
};
