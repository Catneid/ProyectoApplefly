// dotenv (cargado por config.js) tiene que haber corrido antes de leer NODE_ENV
import "../../config.js";

// Opciones de la cookie de sesión del panel. Login y logout usan este mismo
// objeto: el navegador solo borra una cookie si el clearCookie coincide con
// las opciones con las que se creó (path, sameSite, secure), así que no se
// deben escribir por separado.
export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
