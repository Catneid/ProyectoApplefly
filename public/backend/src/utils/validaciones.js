// Validaciones de lo que llega del cliente en un pago. Se usan en el checkout
// (web y app) para rechazar datos mal formados ANTES de reservar stock o cobrar.

export const texto = (valor, max) => (typeof valor === "string" ? valor.trim().slice(0, max) : "");

// Un correo "razonable": TEXTO (no un objeto como { "$ne": null }, que en una
// consulta de Mongo se interpretaría como operador), sin espacios, con @ y un
// punto en el dominio, y de largo acotado.
export const esCorreo = (valor) =>
  typeof valor === "string" && valor.length <= 254 && /^\S+@\S+\.\S+$/.test(valor);

// Devuelve la tarjeta normalizada (strings limpios) o null si no es válida.
export const leerTarjeta = (tarjeta) => {
  const numero = String(tarjeta?.numero ?? "").replace(/\s/g, "");
  const cvv = String(tarjeta?.cvv ?? "").trim();
  const mes = String(tarjeta?.mes ?? "").trim();
  const anio = String(tarjeta?.anio ?? "").trim();

  if (!/^\d{13,19}$/.test(numero) || !/^\d{3,4}$/.test(cvv)) return null;
  if (!/^\d{1,2}$/.test(mes) || +mes < 1 || +mes > 12 || !/^\d{4}$/.test(anio)) return null;

  const ahora = new Date();
  if (+anio < ahora.getFullYear() || (+anio === ahora.getFullYear() && +mes < ahora.getMonth() + 1)) {
    return null;
  }

  const titular = typeof tarjeta.titular === "string" ? tarjeta.titular.trim().slice(0, 100) : "";
  return { numero, cvv, mes, anio, titular };
};
