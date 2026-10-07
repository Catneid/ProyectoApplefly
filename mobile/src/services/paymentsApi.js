import { apiFetch } from './api';

// Cliente del endpoint de pago de public/backend (POST /api/orders/checkout).
// Nunca hablamos con Wompi directo desde la app: el backend calcula el total,
// reserva el stock, cobra con Wompi y, solo si aprueba, crea el pedido en
// MongoDB. La app nunca crea pedidos por su cuenta.
//
// Del dinero la app NO manda nada: solo qué compra (productId + cantidad).
// Precios, envío, IVA y total los calcula el backend con los datos de la base,
// y los devuelve en la respuesta. La sesión viaja como ID token de Firebase.

// items: [{ productId, quantity }]
//
// Devuelve { orderId, aprobada: true, mensaje, cardLast4, subtotal, shipping,
// tax, total, products } si el pago fue aprobado; total es lo que de verdad
// se cobró. Si Wompi rechaza la tarjeta (402), no hay stock (409) o falta
// algún dato (400), tira un Error con el mensaje pensado para mostrarle al
// cliente.
export async function cobrarConWompi({ items, address, phone, tarjeta, customerName }) {
  const { order } = await apiFetch('/orders/checkout', {
    method: 'POST',
    auth: true,
    body: { products: items, address, phone, tarjeta, customerName },
  });

  return {
    orderId: order._id,
    aprobada: true,
    mensaje: 'Pago aprobado',
    cardLast4: order.payment?.cardLast4,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    products: order.products,
  };
}
