// Validaciones de datos personales. Las mismas reglas están en
// public/backend/src/utils/validaciones.js (el servidor es quien manda) y en
// public/frontend/src/utils/validaciones.js: si se cambia una, hay que
// cambiar las tres.

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;
export const LONGITUD_MAX = { nombre: 50, direccion: 200 };
export const DIRECCION_MIN = 10;

// Letras (con tildes, ñ y ü) y espacios. Sin números ni símbolos.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export const esCorreo = (valor) =>
  typeof valor === 'string' && valor.length <= 254 && /^\S+@\S+\.\S+$/.test(valor.trim());

// Teléfono de El Salvador: 8 dígitos, con guion opcional (7777-7777 o 77777777)
export const esTelefonoSV = (valor) => typeof valor === 'string' && /^\d{4}-?\d{4}$/.test(valor.trim());

// Años cumplidos a hoy. null si no es una fecha; negativo si es futura.
export const edadDesde = (fecha, hoy = new Date()) => {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return null;

  let edad = hoy.getFullYear() - fecha.getFullYear();
  const yaCumplio =
    hoy.getMonth() > fecha.getMonth() ||
    (hoy.getMonth() === fecha.getMonth() && hoy.getDate() >= fecha.getDate());
  if (!yaCumplio) edad -= 1;
  return edad;
};

// Límites del selector de fecha: hoy menos 18 años (la más reciente que sirve)
// y hoy menos 100 años (la más antigua).
const haceAnios = (anios) => {
  const hoy = new Date();
  return new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());
};
export const fechaMaximaNacimiento = () => haceAnios(EDAD_MINIMA);
export const fechaMinimaNacimiento = () => haceAnios(EDAD_MAXIMA);

// "" / null / undefined / solo espacios = vacío
export const campoRequerido = (valor) =>
  valor !== undefined && valor !== null && (typeof valor !== 'string' || valor.trim() !== '');

// Cada errorX devuelve el mensaje a mostrar, o '' si el valor sirve.
export const errorNombre = (valor, etiqueta = 'nombre') => {
  if (!campoRequerido(valor)) return `El ${etiqueta} es requerido`;
  const limpio = valor.trim();
  if (limpio.length > LONGITUD_MAX.nombre) return `Máximo ${LONGITUD_MAX.nombre} caracteres`;
  if (!SOLO_LETRAS.test(limpio) || limpio.replace(/ /g, '').length < 2) {
    return 'Solo letras y espacios (mínimo 2 letras)';
  }
  return '';
};

export const errorTelefono = (valor) => {
  if (!campoRequerido(valor)) return 'El teléfono es requerido';
  return esTelefonoSV(valor) ? '' : 'Formato: 7777-7777';
};

export const errorDireccion = (valor) => {
  if (!campoRequerido(valor)) return 'La dirección es requerida';
  const largo = valor.trim().length;
  if (largo < DIRECCION_MIN) return `Mínimo ${DIRECCION_MIN} caracteres`;
  if (largo > LONGITUD_MAX.direccion) return `Máximo ${LONGITUD_MAX.direccion} caracteres`;
  return '';
};

export const errorFechaNacimiento = (fecha) => {
  if (!fecha) return 'La fecha de nacimiento es requerida';
  const edad = edadDesde(fecha);
  if (edad === null) return 'Fecha inválida';
  if (edad < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años`;
  if (edad > EDAD_MAXIMA) return `La edad no puede pasar de ${EDAD_MAXIMA} años`;
  return '';
};

// Valida los datos personales completos (registro y perfil). Devuelve un
// objeto { campo: mensaje } solo con los campos que fallan; {} si todo sirve.
export const validarDatosPersonales = ({ name, lastName, birthdate, phone, address }) => {
  const errores = {
    name: errorNombre(name, 'nombre'),
    lastName: errorNombre(lastName, 'apellido'),
    birthdate: errorFechaNacimiento(birthdate),
    phone: errorTelefono(phone),
    address: errorDireccion(address),
  };
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje));
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

// ---------------------------------------------------------------------------
// Tarjeta de pago. Mismas reglas que leerTarjeta en
// public/backend/src/utils/validaciones.js (que es quien manda): número de 13 a
// 19 dígitos, mes 1-12, año de 4 dígitos, CVV de 3 o 4 dígitos y que no esté
// vencida. El titular (obligatorio, solo letras) se exige además acá.
// ---------------------------------------------------------------------------

export const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// "4573690001990693" -> "4573 6900 0199 0693" (hasta 19 dígitos). Se llama en
// cada cambio del campo, así que también descarta letras y símbolos.
export const formatearNumeroTarjeta = (valor) =>
  soloDigitos(valor).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

export const errorNumeroTarjeta = (valor) => {
  const digitos = soloDigitos(valor);
  if (!digitos) return 'El número de tarjeta es requerido';
  if (digitos.length < 13 || digitos.length > 19) return 'El número debe tener entre 13 y 19 dígitos';
  return '';
};

export const errorMes = (valor) => {
  if (!/^\d{1,2}$/.test(String(valor ?? ''))) return 'Mes de 01 a 12';
  return +valor >= 1 && +valor <= 12 ? '' : 'Mes de 01 a 12';
};

export const errorAnio = (valor) => (/^\d{4}$/.test(String(valor ?? '')) ? '' : 'Usa 4 dígitos');

// Tarjeta vencida: el mes y año de vencimiento son anteriores al mes actual
// (una tarjeta vale hasta el último día de su mes de vencimiento).
export const estaVencida = (mes, anio, hoy = new Date()) =>
  +anio < hoy.getFullYear() || (+anio === hoy.getFullYear() && +mes < hoy.getMonth() + 1);

export const errorCvv = (valor) => (/^\d{3,4}$/.test(String(valor ?? '')) ? '' : '3 o 4 dígitos');

export const errorTitular = (valor) => {
  if (!campoRequerido(valor)) return 'El titular es requerido';
  const limpio = valor.trim();
  if (limpio.length > 100) return 'Máximo 100 caracteres';
  if (!SOLO_LETRAS.test(limpio) || limpio.replace(/ /g, '').length < 2) {
    return 'Solo letras y espacios (como aparece en la tarjeta)';
  }
  return '';
};

// Valida la tarjeta completa. Devuelve { campo: mensaje } solo con lo que falla.
export const validarTarjeta = ({ numero, mes, anio, cvv, titular }) => {
  const errores = {
    numero: errorNumeroTarjeta(numero),
    mes: errorMes(mes),
    anio: errorAnio(anio),
    cvv: errorCvv(cvv),
    titular: errorTitular(titular),
  };

  // Solo si mes y año están bien formados tiene sentido compararlos con hoy
  if (!errores.mes && !errores.anio && estaVencida(mes, anio)) {
    errores.anio = 'La tarjeta está vencida';
  }

  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje));
};
