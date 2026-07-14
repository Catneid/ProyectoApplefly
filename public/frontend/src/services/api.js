/**
 * Punto único por donde pasan todas las llamadas al backend de la tienda.
 * Centralizarlo evita repetir en cada hook el credentials, los headers y el
 * manejo de errores, y hace que un error del servidor llegue siempre como
 * una excepción con el mensaje que el backend quiso comunicar.
 */
export const api = async (ruta, opciones = {}) => {
  const respuesta = await fetch(`/api${ruta}`, {
    // Sin esto las cookies de sesión no viajan y todo da 401
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.message || 'No se pudo completar la operación');
  }

  return datos;
};
