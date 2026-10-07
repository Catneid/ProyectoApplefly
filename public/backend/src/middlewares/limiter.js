import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { status: 429, error: "Demasiadas solicitudes, intenta más tarde" },
});

// Más estricto que el general: cada intento llega a Wompi, y sin límite sirve
// para probar tarjetas robadas.
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Demasiados intentos de pago, intenta de nuevo en unos minutos" },
});

// El formulario de contacto es público: sin sesión, así que el límite es por IP.
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Enviaste varios mensajes seguidos, intenta de nuevo en unos minutos" },
});

export default limiter;
