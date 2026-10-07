import { apiFetch, ApiError } from './api';
import { mapearCategoria, mapearProducto, mapearResena } from './adaptadores';

// Catálogo, categorías y reseñas salen de la API de public/backend (MongoDB):
// lo que el admin cambia en el panel se ve acá sin pasos intermedios. Las
// funciones mantienen los mismos nombres y la misma forma de datos que tenían
// cuando leían de Firestore (ver adaptadores.js).

export async function getProductos() {
  const productos = await apiFetch('/products');
  return productos.map(mapearProducto);
}

// null si el producto no existe
export async function getProductoPorId(id) {
  try {
    return mapearProducto(await apiFetch(`/products/${id}`));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404)) return null;
    throw error;
  }
}

export async function getCategorias() {
  const categorias = await apiFetch('/categories');
  return categorias.map(mapearCategoria);
}

export async function getResenasPorProducto(productId) {
  const resenas = await apiFetch(`/reviews/producto/${productId}`);
  return resenas.map(mapearResena);
}

// El backend decide si esta persona puede reseñar: solo quien compró el
// producto, y una sola vez. Devuelve { comprado, puedeResenar, miReview }.
export async function puedeResenar(productId) {
  const datos = await apiFetch(`/reviews/puedo-resenar/${productId}`, { auth: true });
  return {
    comprado: datos.comprado,
    puedeResenar: datos.puedeReseñar,
    miReview: datos.miReview ? mapearResena(datos.miReview) : null,
  };
}

// El nombre que se muestra lo pone el backend (el de la cuenta); acá no se
// manda ni el usuario ni el nombre.
export async function crearResena({ productId, rating, comment }) {
  const { review } = await apiFetch('/reviews', {
    method: 'POST',
    auth: true,
    body: { productId, rating, comment },
  });
  return mapearResena(review);
}

// Editar la reseña propia. Mismas reglas que al crearla (entero 1-5, comentario 3-500).
export async function editarResena(id, { rating, comment }) {
  const { review } = await apiFetch(`/reviews/${id}`, {
    method: 'PUT',
    auth: true,
    body: { rating, comment },
  });
  return mapearResena(review);
}

export async function eliminarResena(id) {
  await apiFetch(`/reviews/${id}`, { method: 'DELETE', auth: true });
}
