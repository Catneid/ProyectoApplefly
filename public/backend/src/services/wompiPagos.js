import fetch from "node-fetch";
import { config } from "../../config.js";

// Los mismos tres pasos que ya orquestaba public/frontend/src/hooks/useWompi.js
// del lado del navegador, movidos acá para que la app mobile pueda pedir
// "cobrame esta tarjeta" en una sola llamada al backend, sin conocer las
// credenciales de Wompi ni encadenar los tres pasos ella misma.
//
// wompiController.js (rutas que ya usa la web) reutiliza estas mismas
// funciones de más bajo nivel, así la lógica no queda duplicada en dos
// lados y el comportamiento de esas rutas no cambia.

// Error de un !response.ok contra la API de Wompi. Se distingue de un error
// cualquiera para que cada controlador pueda decidir, como ya hacía antes,
// con qué status code y forma de body responderle a SU cliente.
export class WompiHttpError extends Error {
  constructor(textoWompi) {
    super(textoWompi);
    this.name = "WompiHttpError";
    this.wompiRaw = textoWompi;
  }
}

export async function obtenerTokenWompi() {
  const response = await fetch("https://id.wompi.sv/connect/token", {
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
  });

  if (!response.ok) {
    throw new WompiHttpError(await response.text());
  }

  return response.json(); // { access_token, ... }
}

export async function tokenizarTarjetaWompi({
  token,
  numeroTarjeta,
  cvv,
  mesVencimiento,
  anioVencimiento,
  nombreTarjetaHabiente,
}) {
  const response = await fetch("https://api.wompi.sv/tokenizacion", {
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
  });

  if (!response.ok) {
    throw new WompiHttpError(await response.text());
  }

  return response.json(); // { token, tarjetaEnmascarada, ... }
}

export async function cobrarTokenWompi({ token, formData }) {
  const response = await fetch("https://api.wompi.sv/TransaccionCompra/TokenizadaSin3Ds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new WompiHttpError(await response.text());
  }

  return response.json(); // { esAprobada, idTransaccion, codigoAutorizacion, mensaje }
}

export async function cobrarToken3DSWompi({ token, formData }) {
  const response = await fetch("https://api.wompi.sv/TransaccionCompra/3Ds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new WompiHttpError(await response.text());
  }

  return response.json();
}

// Encadena token -> tokenizar -> cobrar, igual que useWompi.js. Corre
// entero en el servidor: la app mobile nunca ve las credenciales de Wompi
// ni el access_token intermedio. Si el cobro es rechazado, tira (no
// devuelve "aprobada: false") para que el llamador nunca tenga que acordarse
// de chequear un campo — un cobro que no aprobó es, para todo efecto
// práctico, un error.
export async function procesarCobroWompi({ monto, nombreCliente, emailCliente, tarjeta }) {
  const { access_token } = await obtenerTokenWompi();

  const tokenizada = await tokenizarTarjetaWompi({
    token: access_token,
    numeroTarjeta: tarjeta.numero.replace(/\s/g, ""),
    cvv: tarjeta.cvv,
    mesVencimiento: tarjeta.mes,
    anioVencimiento: tarjeta.anio,
    nombreTarjetaHabiente: tarjeta.titular || nombreCliente,
  });

  const transaccion = await cobrarTokenWompi({
    token: access_token,
    formData: {
      monto,
      nombreCliente,
      emailCliente,
      tokenTarjeta: tokenizada.token,
    },
  });

  if (!transaccion.esAprobada) {
    throw new Error(transaccion.mensaje || "La tarjeta fue rechazada");
  }

  return {
    idTransaccion: transaccion.idTransaccion,
    codigoAutorizacion: transaccion.codigoAutorizacion,
    mensaje: transaccion.mensaje,
    // "4573 6900 XXXX 0693" -> nos quedamos con los últimos 4 dígitos
    cardLast4: tokenizada.tarjetaEnmascarada?.trim().slice(-4),
  };
}
