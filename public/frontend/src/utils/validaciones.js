// Validaciones de datos personales. Las mismas reglas están en
// public/backend/src/utils/validaciones.js (el servidor es quien manda) y en
// mobile/src/utils/validaciones.js: si se cambia una, hay que cambiar las tres.

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;
export const LONGITUD_MAX = { nombre: 50, direccion: 200 };
export const DIRECCION_MIN = 10;

// Letras (con tildes, ñ y ü) y espacios. Sin números ni símbolos.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

// Teléfono de El Salvador: 8 dígitos, con guion opcional (7777-7777 o 77777777)
export const esTelefonoSV = (valor) => typeof valor === 'string' && /^\d{4}-?\d{4}$/.test(valor.trim());

// "AAAA-MM-DD" (lo que da <input type="date">) -> Date a medianoche local, o
// null si no es una fecha real.
const leerFechaInput = (valor) => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
};

// Años cumplidos a hoy. null si no es una fecha; negativo si es futura.
export const edadDesde = (valor, hoy = new Date()) => {
  const fecha = valor instanceof Date ? valor : leerFechaInput(valor);
  if (!fecha) return null;

  let edad = hoy.getFullYear() - fecha.getFullYear();
  const yaCumplio =
    hoy.getMonth() > fecha.getMonth() ||
    (hoy.getMonth() === fecha.getMonth() && hoy.getDate() >= fecha.getDate());
  if (!yaCumplio) edad -= 1;
  return edad;
};

// Atributos min y max del <input type="date">, en formato AAAA-MM-DD
const haceAnios = (anios) => {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};
export const fechaMaximaNacimiento = () => haceAnios(EDAD_MINIMA);
export const fechaMinimaNacimiento = () => haceAnios(EDAD_MAXIMA);

// Reglas para react-hook-form: devuelven true si sirve, o el mensaje de error.
export const reglaNombre = (etiqueta) => (valor) => {
  const limpio = (valor ?? '').trim();
  if (!limpio) return `El ${etiqueta} es requerido`;
  if (limpio.length > LONGITUD_MAX.nombre) return `Máximo ${LONGITUD_MAX.nombre} caracteres`;
  if (!SOLO_LETRAS.test(limpio) || limpio.replace(/ /g, '').length < 2) {
    return 'Solo letras y espacios (mínimo 2 letras)';
  }
  return true;
};

export const reglaTelefono = (valor) => {
  if (!(valor ?? '').trim()) return 'El teléfono es requerido';
  return esTelefonoSV(valor) || 'Formato: 7777-7777';
};

export const reglaDireccion = (valor) => {
  const largo = (valor ?? '').trim().length;
  if (!largo) return 'La dirección es requerida';
  if (largo < DIRECCION_MIN) return `Mínimo ${DIRECCION_MIN} caracteres`;
  if (largo > LONGITUD_MAX.direccion) return `Máximo ${LONGITUD_MAX.direccion} caracteres`;
  return true;
};

export const reglaFechaNacimiento = (valor) => {
  if (!valor) return 'La fecha de nacimiento es requerida';
  const edad = edadDesde(valor);
  if (edad === null) return 'Fecha inválida';
  if (edad < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años`;
  if (edad > EDAD_MAXIMA) return `La edad no puede pasar de ${EDAD_MAXIMA} años`;
  return true;
};

// Reseñas: mismas reglas que el servidor (public/backend/src/utils/validaciones.js)
export const COMENTARIO = { min: 3, max: 500 };

export const errorCalificacion = (rating) =>
  Number.isInteger(rating) && rating >= 1 && rating <= 5 ? '' : 'Elige de 1 a 5 estrellas';

export const errorComentario = (comentario) => {
  const largo = typeof comentario === 'string' ? comentario.trim().length : 0;
  if (largo === 0) return 'El comentario es requerido';
  if (largo < COMENTARIO.min) return `Mínimo ${COMENTARIO.min} caracteres`;
  if (largo > COMENTARIO.max) return `Máximo ${COMENTARIO.max} caracteres`;
  return '';
};
