// Un correo "razonable": TEXTO (no un objeto como { "$ne": null }, que en una
// consulta de Mongo se interpretaría como operador), sin espacios, con @ y un
// punto en el dominio, y de largo acotado.
export const esCorreo = (valor) =>
  typeof valor === "string" && valor.length <= 254 && /^\S+@\S+\.\S+$/.test(valor);
