import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Firestore solo se usa para leer users/{uid}.pushToken y poder avisarle al
// cliente cuando cambia el estado de su pedido. Clave de cuenta de servicio
// del MISMO proyecto de Firebase que usa la app (nunca se sube a git):
//   1. FIREBASE_SERVICE_ACCOUNT_PATH, si está definida (producción);
//   2. private/backend/firebaseServiceAccountKey.json;
//   3. en desarrollo, la que ya tiene public/backend.
const CANDIDATAS = [
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  path.join(__dirname, "../../firebaseServiceAccountKey.json"),
  path.join(__dirname, "../../../../public/backend/firebaseServiceAccountKey.json"),
].filter(Boolean);

// Inicialización perezosa a propósito: si no hay clave, solo fallan las
// notificaciones (que son best-effort), no el panel de administración.
export function getFirestoreApp() {
  if (getApps().length === 0) {
    const ruta = CANDIDATAS.find((candidata) => existsSync(candidata));
    if (!ruta) {
      throw new Error("No hay clave de servicio de Firebase (ver src/config/firebaseAdmin.js)");
    }
    initializeApp({ credential: cert(JSON.parse(readFileSync(ruta, "utf8"))) });
  }
  return getFirestore();
}
