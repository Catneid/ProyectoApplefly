import fetch from "node-fetch";

// Cliente mínimo de la API de Expo Push. No hace falta ninguna credencial
// propia: cualquier backend puede mandar a un pushToken de Expo válido.
export async function enviarPushExpo(pushToken, { title, body, data }) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ to: pushToken, title, body, data, sound: "default" }),
  });

  const resultado = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Expo Push respondió ${response.status}: ${JSON.stringify(resultado)}`);
  }

  // Ojo acá: la API de Expo Push responde 200 (response.ok = true) AUNQUE
  // el envío puntual haya fallado (token inválido, mal formado, etc.) — el
  // estado real de ese envío viene en el "ticket" dentro de data, no en el
  // status HTTP. Sin este chequeo, un fallo queda invisible: no se loguea
  // ningún warning y la notificación nunca llega, sin dejar rastro.
  const ticket = Array.isArray(resultado?.data) ? resultado.data[0] : resultado?.data;
  if (ticket?.status === "error") {
    throw new Error(
      `Expo Push rechazó el envío: ${ticket.message || JSON.stringify(ticket.details)}`
    );
  }

  console.log("[expoPush] Ticket de envío:", JSON.stringify(ticket));
  return resultado;
}
