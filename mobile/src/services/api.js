import { auth } from './firebase';

// Cliente de la API de public/backend: productos, categorías, reseñas,
// pedidos y pagos. MongoDB es la única fuente de verdad; Firestore solo
// guarda el perfil y el push token en users/{uid}.
//
// EXPO_PUBLIC_API_URL tiene que ser una URL donde el celular pueda llegar de
// verdad (la IP de tu compu en la red WiFi, o la URL pública si ya está
// desplegado) — "localhost" no sirve porque desde el celular "localhost" es
// el celular mismo, no tu PC.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Error de la API con el status HTTP y, si lo trae, el `code` del body, para
// que quien llama pueda decidir (p. ej. 404 = no existe).
export class ApiError extends Error {
  constructor(message, status, datos) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.datos = datos;
  }
}

// `auth: true` manda el ID token de Firebase de la sesión actual como Bearer;
// el backend lo traduce al cliente de Mongo. getIdToken() lo renueva solo si
// está por vencer.
export async function apiFetch(ruta, { method = 'GET', body, auth: conSesion = false } = {}) {
  if (!BASE_URL) {
    throw new Error('La app no está configurada (falta EXPO_PUBLIC_API_URL).');
  }

  const headers = { 'Content-Type': 'application/json' };

  if (conSesion) {
    const usuario = auth.currentUser;
    if (!usuario) throw new ApiError('Inicia sesión para continuar.', 401);
    headers.Authorization = `Bearer ${await usuario.getIdToken()}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/api${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ApiError(
      datos?.message || datos?.mensaje || 'No se pudo completar la operación.',
      respuesta.status,
      datos
    );
  }

  return datos;
}
