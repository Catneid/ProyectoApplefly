import customerModel from "../models/customers.js";
import { getFirestoreApp } from "../config/firebaseAdmin.js";
import { enviarPushExpo } from "./expoPush.js";

// Qué se le avisa al cliente en cada cambio de estado. "pendiente" no tiene
// aviso: es el estado inicial (volver a él no es una novedad).
const MENSAJES = {
  procesando: "Estamos preparando tu pedido.",
  enviado: "¡Tu pedido va en camino!",
  entregado: "Tu pedido fue entregado. ¡Gracias por tu compra!",
  cancelado: "Tu pedido fue cancelado.",
};

// Avisa por push al cliente del pedido que cambió de estado. El token vive en
// Firestore (users/{uid}.pushToken, lo guarda la app); el puente desde Mongo
// es customers.firebaseUid.
//
// Es best-effort: NUNCA tira. Si el cliente no usa la app, no dio permiso,
// no hay clave de Firebase o Expo falla, el cambio de estado ya se guardó y
// solo queda una línea en el log.
export async function notificarCambioEstado(pedido) {
  try {
    const mensaje = MENSAJES[pedido.status];
    if (!mensaje) return;

    const cliente = await customerModel.findById(pedido.customerId).select("firebaseUid").lean();
    if (!cliente?.firebaseUid) return;

    const perfil = await getFirestoreApp().collection("users").doc(cliente.firebaseUid).get();
    const pushToken = perfil.exists ? perfil.data()?.pushToken : null;
    if (!pushToken) return;

    await enviarPushExpo(pushToken, {
      title: "Tu pedido de Applefly",
      body: mensaje,
      data: { orderId: String(pedido._id), status: pedido.status },
    });
  } catch (error) {
    console.log(`[push] No se pudo avisar del pedido ${pedido?._id}:`, error.message);
  }
}
