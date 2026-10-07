import { apiFetch } from './api';
import { mapearPedido } from './adaptadores';

// Ver src/services/adaptadores.js para la forma de los datos.
//
// A propósito NO hay un crearOrden() acá: un pedido solo se crea pagando
// (POST /api/orders/checkout), que calcula el total en el servidor, cobra con
// Wompi y recién entonces guarda el pedido — ver src/services/paymentsApi.js
// y app/checkout.jsx.

export async function getMisOrdenes() {
  const ordenes = await apiFetch('/orders/mis-pedidos', { auth: true });
  return ordenes.map(mapearPedido);
}

const INTERVALO_MS = 20000;

// Mantiene la lista al día mientras la pantalla está abierta: la carga al
// empezar y la repite cada 20 segundos, así un cambio de estado hecho en el
// panel (procesando → enviado) se refleja solo. Devuelve el unsubscribe — hay
// que llamarlo al desmontar la pantalla.
//
// onError solo se llama si falla la PRIMERA carga (para mostrar "reintentar");
// un fallo de red en una repetición se ignora y se vuelve a intentar luego,
// con la lista anterior todavía en pantalla. Cada carga que sale bien llama a
// callback, y quien lo usa debe limpiar su estado de error ahí (la repetición
// sigue corriendo aunque la primera haya fallado, y así se recupera sola).
//
// El primer parámetro se conserva por compatibilidad: ya no hace falta, el
// backend toma el cliente de la sesión.
export function escucharMisOrdenes(_customerId, callback, onError) {
  let activo = true;
  let primera = true;
  let enCurso = false;

  const cargar = async () => {
    if (enCurso) return;
    enCurso = true;
    try {
      const ordenes = await getMisOrdenes();
      if (activo) callback(ordenes);
      primera = false;
    } catch (error) {
      if (primera) {
        console.warn('[orders] escucharMisOrdenes falló:', error.message);
        if (activo) onError?.(error);
        primera = false;
      }
    } finally {
      enCurso = false;
    }
  };

  cargar();
  const timer = setInterval(cargar, INTERVALO_MS);

  return () => {
    activo = false;
    clearInterval(timer);
  };
}
