import fetch from "node-fetch";
import { config } from "../../config.js";

// Cliente de la API de Wompi. Todo corre en el servidor: ni la web ni la app
// ven nunca las credenciales ni el access_token intermedio. Lo usa el
// checkout (services/checkout.js).

// Tiempo máximo de CADA llamada a Wompi (lectura del cuerpo incluida). Se puede
// cambiar con WOMPI_TIMEOUT_MS, pensado para pruebas.
const TIMEOUT_MS = Number(process.env.WOMPI_TIMEOUT_MS) || 20000;

// -------------------------------------------------------------------------
// Errores. Lo importante para el checkout es SI ALCANZÓ A COBRAR:
//
//  WompiRechazoError   Wompi contestó esAprobada === false. No se cobró.
//  WompiHttpError      Wompi contestó con un status de error (no 2xx).
//  WompiPreCobroError  Falló el token o la tokenización. TODAVÍA no se cobró.
//  WompiCobroIncierto  Falló la red o la lectura de la respuesta DURANTE el
//                      cobro: no sabemos si Wompi cobró. Es el único caso en
//                      que NO se puede devolver el stock a ciegas.
// -------------------------------------------------------------------------

// Error de un !response.ok contra la API de Wompi. Se distingue de un error
// cualquiera para no reenviarle al cliente el texto crudo de Wompi.
export class WompiHttpError extends Error {
  constructor(textoWompi, status) {
    super(textoWompi);
    this.name = "WompiHttpError";
    this.wompiRaw = textoWompi;
    this.status = status;
  }
}

// Wompi rechazó la tarjeta (esAprobada === false). `message` es el mensaje que
// da Wompi, pensado para mostrarse al cliente.
export class WompiRechazoError extends Error {
  constructor(mensajeWompi) {
    super(mensajeWompi);
    this.name = "WompiRechazoError";
  }
}

// Falla de red, timeout o respuesta ilegible. Su `message` es el de node-fetch
// (direcciones, códigos del sistema...): sirve para el log, NUNCA para el cliente.
export class WompiRedError extends Error {
  constructor(causa) {
    super(causa?.message || "Falla de red con Wompi");
    this.name = "WompiRedError";
    this.causa = causa;
  }
}

// Falló el token o la tokenización: todavía no se cobró nada.
export class WompiPreCobroError extends Error {
  constructor(causa) {
    super("No se pudo preparar el cobro con Wompi");
    this.name = "WompiPreCobroError";
    this.causa = causa;
  }
}

// No sabemos si Wompi cobró. `cardLast4` (si se alcanzó a tokenizar) sirve
// para conciliar el cobro a mano.
export class WompiCobroIncierto extends Error {
  constructor(causa, { cardLast4 } = {}) {
    super("No se pudo confirmar el cobro con Wompi");
    this.name = "WompiCobroIncierto";
    this.causa = causa;
    this.cardLast4 = cardLast4;
  }
}

// Una llamada HTTP a Wompi con timeout. Devuelve el JSON, o lanza:
//  - WompiHttpError si Wompi contestó con status de error,
//  - WompiRedError si hubo timeout, corte de conexión o el cuerpo no es JSON.
async function llamarWompi(url, opciones) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...opciones, signal: controlador.signal });

    if (!response.ok) {
      throw new WompiHttpError(await response.text(), response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof WompiHttpError) throw error;
    // AbortError (timeout), ECONNRESET, DNS, cuerpo cortado o que no es JSON...
    throw new WompiRedError(controlador.signal.aborted ? new Error("Timeout con Wompi") : error);
  } finally {
    clearTimeout(temporizador);
  }
}

export function obtenerTokenWompi() {
  return llamarWompi("https://id.wompi.sv/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: config.wompi.grant_type,
      audience: config.wompi.audience,
      client_id: config.wompi.client_id,
      client_secret: config.wompi.client_secret,
    }),
  }); // { access_token, ... }
}

export function tokenizarTarjetaWompi({
  token,
  numeroTarjeta,
  cvv,
  mesVencimiento,
  anioVencimiento,
  nombreTarjetaHabiente,
}) {
  return llamarWompi("https://api.wompi.sv/tokenizacion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      numeroTarjeta,
      cvv,
      mesVencimiento: parseInt(mesVencimiento),
      anioVencimiento: parseInt(anioVencimiento),
      nombreTarjetaHabiente,
    }),
  }); // { token, tarjetaEnmascarada, ... }
}

export function cobrarTokenWompi({ token, formData }) {
  return llamarWompi("https://api.wompi.sv/TransaccionCompra/TokenizadaSin3Ds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  }); // { esAprobada, idTransaccion, codigoAutorizacion, mensaje }
}

// Encadena token -> tokenizar -> cobrar. Devuelve el cobro aprobado o tira uno
// de los errores de arriba; el que llama decide qué hacer con el stock según
// SI ALCANZÓ A COBRAR (ver services/checkout.js).
export async function procesarCobroWompi({ monto, nombreCliente, emailCliente, tarjeta }) {
  // ---- Todavía no se cobró nada ----
  let access_token;
  try {
    ({ access_token } = await obtenerTokenWompi());
  } catch (error) {
    throw new WompiPreCobroError(error);
  }

  let tokenizada;
  try {
    tokenizada = await tokenizarTarjetaWompi({
      token: access_token,
      numeroTarjeta: tarjeta.numero.replace(/\s/g, ""),
      cvv: tarjeta.cvv,
      mesVencimiento: tarjeta.mes,
      anioVencimiento: tarjeta.anio,
      nombreTarjetaHabiente: tarjeta.titular || nombreCliente,
    });
  } catch (error) {
    // Wompi contestó con un 4xx: la tarjeta es inválida, es un problema del
    // cliente y no nuestro. Cualquier otra cosa (5xx, red, timeout) sí lo es.
    if (error instanceof WompiHttpError && error.status >= 400 && error.status < 500) throw error;
    throw new WompiPreCobroError(error);
  }

  // "4573 6900 XXXX 0693" -> nos quedamos con los últimos 4 dígitos
  const cardLast4 = tokenizada.tarjetaEnmascarada?.trim().slice(-4);

  // ---- A partir de acá se puede haber cobrado ----
  let transaccion;
  try {
    transaccion = await cobrarTokenWompi({
      token: access_token,
      formData: {
        monto,
        nombreCliente,
        emailCliente,
        tokenTarjeta: tokenizada.token,
      },
    });
  } catch (error) {
    // Un 4xx es un "no" explícito de Wompi: no se cobró. Un 5xx, un corte de
    // red, un timeout o una respuesta ilegible NO nos dicen si cobró o no.
    if (error instanceof WompiHttpError && error.status < 500) throw error;
    throw new WompiCobroIncierto(error, { cardLast4 });
  }

  if (transaccion?.esAprobada === false) {
    throw new WompiRechazoError(transaccion.mensaje || "La tarjeta fue rechazada");
  }

  // Ni aprobada ni rechazada: una respuesta con una forma que no esperamos no
  // es un "no" explícito, no se puede asumir que no cobró.
  if (transaccion?.esAprobada !== true) {
    throw new WompiCobroIncierto(new Error("Respuesta de cobro inesperada"), { cardLast4 });
  }

  return {
    idTransaccion: transaccion.idTransaccion,
    codigoAutorizacion: transaccion.codigoAutorizacion,
    mensaje: transaccion.mensaje,
    cardLast4,
  };
}
