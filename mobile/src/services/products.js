import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from './firebase';

const mapearDoc = (documento) => ({ id: documento.id, ...documento.data() });

// Ver src/services/firestoreSchema.js para la forma exacta de cada campo.

export async function getProductos() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snap.docs.map(mapearDoc);
}

// Versión en tiempo real de getProductos: útil para un listado de catálogo
// que se quiera actualizar solo si cambia el stock/precio de algo. callback
// recibe el array de productos cada vez que hay un cambio. Devuelve la
// función de unsubscribe — hay que llamarla al desmontar la pantalla.
export function escucharProductos(callback) {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapearDoc)));
}

export async function getProductoPorId(id) {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? mapearDoc(snap) : null;
}

export async function getCategorias() {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(mapearDoc);
}

// No recalcula el rating/reviewsCount desnormalizado del producto — eso
// queda pendiente para cuando se arme la pantalla de detalle de producto,
// probablemente mejor como Cloud Function que escuche "reviews" en vez de
// hacerlo a mano acá.
export async function crearResena({ productId, userId, userName, rating, comment }) {
  const referencia = await addDoc(collection(db, 'reviews'), {
    productId,
    userId,
    userName,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  return referencia.id;
}

export async function getResenasPorProducto(productId) {
  // Ojo: where + orderBy en campos distintos necesita un índice compuesto.
  // La primera vez que corra esta query, Firestore va a tirar un error con
  // un link para crearlo con un click en la consola.
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapearDoc);
}
