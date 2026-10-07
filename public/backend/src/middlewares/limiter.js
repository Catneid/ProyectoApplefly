import rateLimit from "express-rate-limit";

// Cada limiter es una instancia propia, con su propio contador por IP: así el
// registro, el login y la recuperación no se gastan los intentos entre sí (con
// un único limiter compartido, 30 peticiones entre las tres rutas dejaban a
// alguien sin poder iniciar sesión por haber probado el registro).
//
// El cuerpo es { message }, la clave que leen los frontends.
const crearLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    message: { message },
  });

export const loginLimiter = crearLimiter(30, "Demasiados intentos de inicio de sesión, intenta de nuevo en unos minutos");
export const registerLimiter = crearLimiter(20, "Demasiadas solicitudes de registro, intenta de nuevo en unos minutos");
export const recoveryLimiter = crearLimiter(20, "Demasiadas solicitudes de recuperación, intenta de nuevo en unos minutos");

// Más estricto que los de arriba: cada intento llega a Wompi, y sin límite sirve
// para probar tarjetas robadas.
export const checkoutLimiter = crearLimiter(10, "Demasiados intentos de pago, intenta de nuevo en unos minutos");

// El formulario de contacto es público: sin sesión, así que el límite es por IP.
export const contactLimiter = crearLimiter(5, "Enviaste varios mensajes seguidos, intenta de nuevo en unos minutos");
