import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { db } from './firebase';

const mapearDoc = (documento) => ({ id: documento.id, ...documento.data() });

// Ver src/services/firestoreSchema.js para la forma exacta de cada campo.
//
// A propósito NO hay un crearOrden() acá: la app nunca escribe la colección
// "orders" directo en Firestore. El pedido se crea en public/backend
// (src/controller/wompiAppController.js), con el Admin SDK, y solo después
// de que Wompi aprueba el cobro — ver src/services/paymentsApi.js y
// app/checkout.jsx. firestore.rules (en la raíz del repo) reflejan esto:
// un cliente autenticado puede leer sus propios pedidos, pero no crearlos
// ni modificarlos.

export async function getMisOrdenes(customerId) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapearDoc);
}

// Versión en tiempo real: pensada para una pantalla de "mis pedidos" que
// quiera reflejar solo el cambio de estado (pendiente -> enviado ->
// entregado) sin que el usuario tenga que refrescar. Devuelve el
// unsubscribe — hay que llamarlo al desmontar la pantalla.
//
// onError es opcional pero importante: sin él, un permission-denied (por
// ejemplo, si todavía no existe el índice compuesto) o un corte de red
// deja el listener muerto en silencio, y la pantalla se queda con el
// spinner de carga para siempre.
export function escucharMisOrdenes(customerId, callback, onError) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(mapearDoc)),
    (error) => {
      console.warn('[orders] escucharMisOrdenes falló:', error.message);
      onError?.(error);
    }
  );
}
