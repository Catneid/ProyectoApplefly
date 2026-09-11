import { getFirestoreMobile } from "../config/firebaseAdmin.js";

// Proxy perezoso: no toca firebaseServiceAccountKey.json ni inicializa
// firebase-admin hasta el primer uso real (el primer pedido pagado). Así,
// si todavía no colocaste la clave de servicio en su lugar, el resto de la
// tienda (Mongo, login, catálogo web) sigue funcionando sin problema — solo
// falla la ruta que de verdad necesita Firestore.
function crearProxyPerezoso(obtenerInstancia) {
  return new Proxy(
    {},
    {
      get(_objetivo, propiedad) {
        const instancia = obtenerInstancia();
        const valor = instancia[propiedad];
        return typeof valor === "function" ? valor.bind(instancia) : valor;
      },
    }
  );
}

// Firestore de la app mobile. Nombrada "dbMobile" a propósito, para no
// confundirla nunca con la conexión de Mongo que ya existe en database.js.
export const dbMobile = crearProxyPerezoso(getFirestoreMobile);
