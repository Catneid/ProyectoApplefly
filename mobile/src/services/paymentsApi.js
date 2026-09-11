// Cliente del endpoint de pagos de public/backend. Nunca hablamos con
// Wompi directo desde la app: el backend hace token + tokenizar + cobrar
// (misma lógica que public/frontend/src/hooks/useWompi.js) y, solo si
// aprueba, crea el pedido en Firestore. La app nunca escribe la colección
// "orders" — eso es a propósito, ver firestore.rules.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Devuelve { orderId, aprobada: true, mensaje, cardLast4 } si el pago fue
// aprobado. Si Wompi rechaza la tarjeta (402) o falta algún dato (400),
// tira un Error con el mensaje pensado para mostrarle al cliente.
export async function cobrarConWompi({
  idToken,
  items,
  address,
  phone,
  subtotal,
  shipping,
  tax,
  total,
  tarjeta,
  customerName,
}) {
  if (!BASE_URL) {
    throw new Error('La app no está configurada para procesar pagos (falta EXPO_PUBLIC_API_URL).');
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/api/wompi/app/cobrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ items, address, phone, subtotal, shipping, tax, total, tarjeta, customerName }),
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor de pagos. Revisá tu conexión e intentá de nuevo.');
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || datos?.message || 'No se pudo procesar el pago.');
  }

  return datos;
}
