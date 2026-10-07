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

// ---------------------------------------------------------------------------
// Datos personales del cliente (registro y perfil). Las mismas reglas están
// copiadas en mobile/src/utils/validaciones.js y public/frontend/src/utils/
// validaciones.js: si se cambia una, hay que cambiar las tres.
// ---------------------------------------------------------------------------

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;
export const LONGITUD_MAX = { nombre: 50, direccion: 200 };
export const DIRECCION_MIN = 10;

// Letras (con tildes, ñ y ü) y espacios; al menos dos letras. Sin números ni símbolos.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export const esNombre = (valor) =>
  typeof valor === "string" &&
  SOLO_LETRAS.test(valor) &&
  valor.replace(/ /g, "").length >= 2 &&
  valor.length <= LONGITUD_MAX.nombre;

// Teléfono de El Salvador: 8 dígitos, con guion opcional (7777-7777 o 77777777)
export const esTelefonoSV = (valor) => typeof valor === "string" && /^\d{4}-?\d{4}$/.test(valor);

// Convierte lo que llega (texto "2000-05-17", ISO completo o Date) en Date, o
// null si no es una fecha real. Los textos se interpretan en UTC, igual que los
// manda JSON.stringify(Date), así el día no se corre.
export const leerFecha = (valor) => {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(valor)) return null;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;

  // new Date("2000-02-31") se corre solo a marzo: se exige que el día exista
  const [anio, mes, dia] = valor.slice(0, 10).split("-").map(Number);
  const original = new Date(Date.UTC(anio, mes - 1, dia));
  if (original.getUTCMonth() !== mes - 1 || original.getUTCDate() !== dia) return null;

  return fecha;
};

// Años cumplidos a hoy (UTC). Una fecha futura da un número negativo.
export const edadDesde = (fecha, hoy = new Date()) => {
  const nacimiento = leerFecha(fecha);
  if (!nacimiento) return null;

  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const cumpleEsteAnio =
    hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
  if (!cumpleEsteAnio) edad -= 1;
  return edad;
};

// "" / null / undefined / solo espacios = el campo no vino
export const campoRequerido = (valor) =>
  valor !== undefined && valor !== null && (typeof valor !== "string" || valor.trim() !== "");

// Cada leerX devuelve { valor } (ya limpio) o { error } con un mensaje claro.
export const leerNombre = (valor, etiqueta = "nombre") => {
  if (typeof valor !== "string") return { error: `El ${etiqueta} no es válido` };
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (limpio.length > LONGITUD_MAX.nombre) {
    return { error: `El ${etiqueta} no puede pasar de ${LONGITUD_MAX.nombre} caracteres` };
  }
  if (!esNombre(limpio)) {
    return { error: `El ${etiqueta} solo puede tener letras y espacios (mínimo 2 letras)` };
  }
  return { valor: limpio };
};

export const leerTelefono = (valor) => {
  if (typeof valor !== "string" || !esTelefonoSV(valor.trim())) {
    return { error: "El teléfono debe tener 8 dígitos, por ejemplo 7777-7777" };
  }
  return { valor: valor.trim() };
};

export const leerDireccion = (valor) => {
  if (typeof valor !== "string") return { error: "La dirección no es válida" };
  const limpio = valor.trim();
  if (limpio.length < DIRECCION_MIN) {
    return { error: `La dirección debe tener al menos ${DIRECCION_MIN} caracteres` };
  }
  if (limpio.length > LONGITUD_MAX.direccion) {
    return { error: `La dirección no puede pasar de ${LONGITUD_MAX.direccion} caracteres` };
  }
  return { valor: limpio };
};

export const leerFechaNacimiento = (valor) => {
  const fecha = leerFecha(valor);
  if (!fecha) return { error: "La fecha de nacimiento no es válida" };

  const edad = edadDesde(fecha);
  if (edad < EDAD_MINIMA) return { error: `Debes tener al menos ${EDAD_MINIMA} años` };
  if (edad > EDAD_MAXIMA) return { error: `La edad no puede pasar de ${EDAD_MAXIMA} años` };
  return { valor: fecha };
};

// ---------------------------------------------------------------------------
// Reseñas. Mismas reglas en mobile/src/utils/validaciones.js y
// public/frontend/src/utils/validaciones.js.
// ---------------------------------------------------------------------------

export const COMENTARIO = { min: 3, max: 500 };

// Devuelve { rating, comment } ya limpios, o { error } con el motivo.
// rating: entero de 1 a 5 (un 4.5, un "5" en texto o un objeto no valen).
// comment: texto de 3 a 500 caracteres sin contar los espacios de los extremos.
export const leerResena = ({ rating, comment }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "La calificación debe ser un número entero de 1 a 5 estrellas" };
  }

  if (typeof comment !== "string") {
    return { error: `El comentario es requerido (de ${COMENTARIO.min} a ${COMENTARIO.max} caracteres)` };
  }
  const limpio = comment.trim();
  if (limpio.length < COMENTARIO.min || limpio.length > COMENTARIO.max) {
    return { error: `El comentario debe tener entre ${COMENTARIO.min} y ${COMENTARIO.max} caracteres` };
  }

  return { rating, comment: limpio };
};
