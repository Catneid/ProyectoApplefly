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
