import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Misma clave de cuenta de servicio que usa scripts/migrate-users-to-firebase
// (podés copiar el mismo archivo acá). Nunca se sube a git.
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../../firebaseServiceAccountKey.json");

// Inicialización perezosa a propósito: si todavía no pusiste la clave de
// servicio en su lugar, que falle solo cuando alguien pegue contra una ruta
// que la necesita (/registerCustomers/mobile) — no que tumbe todo el server
// al arrancar, que rompería el resto de la tienda sin necesidad.
function asegurarInicializado() {
  if (getApps().length > 0) return;

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
}

export function getFirebaseAuth() {
  asegurarInicializado();
  return getAuth();
}

// Firestore del mismo proyecto de Firebase que ya usa la app mobile
// (productos/reseñas/usuarios/pedidos). Se expone como función, no como
// instancia directa, por la misma razón que getFirebaseAuth: que solo falle
// cuando alguien de verdad la use, no al arrancar el servidor.
export function getFirestoreMobile() {
  asegurarInicializado();
  return getFirestore();
}
