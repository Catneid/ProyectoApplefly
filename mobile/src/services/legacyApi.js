// Cliente mínimo para el backend clásico de la web (public/backend), usado
// SOLO como respaldo: cuando alguien intenta loguearse en mobile y todavía
// no tiene cuenta espejo en Firebase Auth (por ejemplo, se registró en la
// web antes de que corriéramos la migración, o justo después).
//
// EXPO_PUBLIC_LEGACY_API_URL tiene que ser una URL donde el celular pueda
// llegar de verdad (la IP de tu compu en la red WiFi, o la URL pública si
// ya está desplegado) — "localhost" no sirve porque desde el celular
// "localhost" es el celular mismo, no tu PC.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, apiFetch } from './api';

const BASE_URL = process.env.EXPO_PUBLIC_LEGACY_API_URL;

// Login contra /api/loginCustomers (Mongo). Devuelve { id, name, email } si
// las credenciales son válidas, o null si no (cuenta inexistente, password
// incorrecta, correo sin verificar, o directamente no hay forma de llegar
// al backend clásico).
export async function loginLegacy(email, password) {
  if (!BASE_URL) {
    console.warn('[legacyApi] EXPO_PUBLIC_LEGACY_API_URL no está configurada: no se intenta el login clásico.');
    return null;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/api/loginCustomers`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    console.warn('[legacyApi] No se pudo llegar al backend clásico (loginCustomers):', error.message);
    return null;
  }

  if (!respuesta.ok) return null;

  const datos = await respuesta.json().catch(() => null);
  return datos?.user ?? null;
}

// Perfil completo (lastName, birthdate, phone, address) vía /api/profile.
// Necesita la cookie de sesión que dejó loginLegacy(). Si por lo que sea no
// viajó (RN no siempre persiste cookies entre llamadas igual que un
// navegador), devolvemos null y migramos igual con los datos mínimos.
export async function perfilLegacy() {
  if (!BASE_URL) return null;

  try {
    const respuesta = await fetch(`${BASE_URL}/api/profile`, {
      credentials: 'include',
    });
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch {
    return null;
  }
}

// Vincula el usuario de Firebase con la cuenta de la web (Mongo) usando la
// contraseña como prueba de que son la misma persona. Hace falta para quien
// se registró en la web: su usuario de Firebase se crea con el correo SIN
// verificar y el backend no vincula por correo sin verificar (cualquiera
// podría crear en Firebase el correo de otra persona).
//
// Se da por resuelto (y no se repite) solo con una respuesta DEFINITIVA del
// servidor: éxito, o 401/404/409 (contraseña que no coincide, sin cuenta en la
// web, ya vinculada a otra). Si la llamada falla por red, timeout, 5xx, 429,
// etc., la marca NO se guarda y se reintenta en el próximo login: si se
// guardara antes, un fallo pasajero dejaría a la persona sin vincular para
// siempre (y con 403 en todo lo que exige correo verificado).
//
// Ojo con el otro lado: si la contraseña de Firebase y la de la web ya no
// coinciden, cada intento cuenta como fallido y bloquea la cuenta de la web.
// Por eso un 401 también cierra el asunto, en vez de repetirse en cada login.
//
// Nunca tira: es best-effort y no puede romper el login. Si el correo ya está
// verificado no hace falta, el backend vincula solo.
const RESPUESTAS_DEFINITIVAS = [401, 404, 409];

// Evita dos intentos a la vez del mismo usuario (la marca recién se guarda al
// terminar, así que sin esto dos logins seguidos contarían doble).
const vinculando = new Set();

export async function vincularCuentaWebUnaVez(usuarioFirebase, password) {
  if (usuarioFirebase.emailVerified) return;

  const clave = `cuenta_web_vinculada_${usuarioFirebase.uid}`;
  if (vinculando.has(clave)) return;
  vinculando.add(clave);

  try {
    if (await AsyncStorage.getItem(clave)) return;

    try {
      await apiFetch('/registerCustomers/link', {
        method: 'POST',
        auth: true,
        body: { password },
      });
    } catch (error) {
      if (!(error instanceof ApiError) || !RESPUESTAS_DEFINITIVAS.includes(error.status)) {
        // Fallo pasajero: sin marca, se vuelve a intentar en el próximo login
        console.warn('[legacyApi] No se pudo vincular con la cuenta de la web, se reintentará:', error.message);
        return;
      }
      // 404 = no hay cuenta de la web con ese correo (usuario solo de la app): normal
      console.warn('[legacyApi] No se vinculó con la cuenta de la web:', error.message);
    }

    await AsyncStorage.setItem(clave, '1');
  } catch (error) {
    console.warn('[legacyApi] No se pudo revisar la vinculación con la cuenta de la web:', error.message);
  } finally {
    vinculando.delete(clave);
  }
}
