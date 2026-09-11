import { FieldValue } from "firebase-admin/firestore";

import { dbMobile } from "../services/firebaseAdmin.js";
import { enviarPushExpo } from "../services/expoPush.js";
import { procesarCobroWompi } from "../services/wompiPagos.js";

const wompiAppController = {};

/**
 * Un solo endpoint para la app: cobra con Wompi y, SOLO si el cobro es
 * aprobado, crea el pedido en Firestore. Si Wompi rechaza la tarjeta no se
 * crea ningún pedido — igual que ya hace Checkout.jsx de la web con Mongo.
 *
 * La app nunca escribe directo en la colección "orders" de Firestore: eso
 * lo hace únicamente este backend, con el Admin SDK (que se salta las
 * reglas de seguridad de Firestore a propósito).
 */
wompiAppController.cobrar = async (req, res) => {
  try {
    const { items, address, phone, subtotal, shipping, tax, total, tarjeta, customerName } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "El pedido no tiene productos" });
    }
    if (!tarjeta?.numero || !tarjeta?.cvv || !tarjeta?.mes || !tarjeta?.anio) {
      return res.status(400).json({ message: "Faltan datos de la tarjeta" });
    }
    if (!address || !phone || typeof total !== "number") {
      return res.status(400).json({ message: "Faltan datos de envío o del pedido" });
    }

    // El correo es el que ya verificó Firebase para este uid (ver
    // verifyFirebaseToken.js), nunca el que mande el body.
    const customerEmail = req.emailApp;

    let cobro;
    try {
      cobro = await procesarCobroWompi({
        monto: total,
        nombreCliente: customerName || customerEmail,
        emailCliente: customerEmail,
        tarjeta,
      });
    } catch (error) {
      // El pago no pasó: no se crea ningún pedido. Nunca reenviamos acá
      // tokens ni credenciales internas de Wompi, solo el mensaje pensado
      // para mostrarle al cliente (mismo que ya usaba useWompi.js).
      return res.status(402).json({ aprobada: false, mensaje: error.message || "El pago fue rechazado" });
    }

    const referencia = await dbMobile.collection("orders").add({
      customerId: req.uidApp,
      customerName: customerName || "",
      customerEmail,
      products: items,
      subtotal,
      shipping,
      tax,
      total,
      status: "procesando",
      address,
      phone,
      payment: {
        method: "wompi",
        transactionId: cobro.idTransaccion,
        status: "aprobado",
        cardLast4: cobro.cardLast4,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    // Best-effort: si no hay pushToken guardado, o Expo Push falla, el
    // pedido ya quedó pagado y creado — no hacemos fallar la respuesta por
    // esto, solo lo dejamos en el log.
    notificarPagoConfirmado(req.uidApp).catch((error) => {
      console.log("[wompiApp] No se pudo enviar la notificación push:", error.message);
    });

    return res.status(201).json({
      orderId: referencia.id,
      aprobada: true,
      mensaje: cobro.mensaje,
      cardLast4: cobro.cardLast4,
    });
  } catch (error) {
    console.log("[wompiApp.cobrar] error inesperado:", error);
    return res.status(500).json({ message: "No se pudo procesar el pedido" });
  }
};

async function notificarPagoConfirmado(customerId) {
  const snap = await dbMobile.collection("users").doc(customerId).get();
  const pushToken = snap.exists ? snap.data()?.pushToken : null;
  if (!pushToken) return;

  await enviarPushExpo(pushToken, {
    title: "¡Pago confirmado!",
    body: "Tu pago fue confirmado, ¡gracias por tu compra!",
  });
}

export default wompiAppController;
