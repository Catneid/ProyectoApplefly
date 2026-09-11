// Cliente mínimo para el backend clásico de la web (public/backend), usado
// SOLO como respaldo: cuando alguien intenta loguearse en mobile y todavía
// no tiene cuenta espejo en Firebase Auth (por ejemplo, se registró en la
// web antes de que corriéramos la migración, o justo después).
//
// EXPO_PUBLIC_LEGACY_API_URL tiene que ser una URL donde el celular pueda
// llegar de verdad (la IP de tu compu en la red WiFi, o la URL pública si
// ya está desplegado) — "localhost" no sirve porque desde el celular
// "localhost" es el celular mismo, no tu PC.
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

// Espejo en Mongo de una cuenta que se acaba de crear en Firebase, para que
// sirva también para loguearse en la web. Devuelve:
// - { status: 'ok', id }       -> se creó bien, id = _id de Mongo
// - { status: 'conflict' }     -> ya había una cuenta de la web con ese email
// - { status: 'unreachable' }  -> no se pudo llegar al backend clásico (URL
//   sin configurar, sin red, error del servidor). No bloqueamos el alta de
//   la app por esto: es un espejo best-effort, no una dependencia dura.
export async function registrarEnMongo({
  name,
  lastName,
  birthdate,
  email,
  password,
  phone,
  address,
  firebaseUid,
  idToken,
}) {
  if (!BASE_URL) {
    console.warn('[legacyApi] EXPO_PUBLIC_LEGACY_API_URL no está configurada: la cuenta no se espeja en Mongo.');
    return { status: 'unreachable' };
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/api/registerCustomers/mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // El backend usa esto para confirmar que quien pide crear el
        // espejo es realmente el dueño del firebaseUid del body, no
        // cualquiera que adivine/copie un uid ajeno.
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name, lastName, birthdate, email, password, phone, address, firebaseUid }),
    });
  } catch (error) {
    console.warn('[legacyApi] No se pudo llegar al backend clásico (registerCustomers/mobile):', error.message);
    return { status: 'unreachable' };
  }

  if (respuesta.status === 409) return { status: 'conflict' };

  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => '');
    console.warn(`[legacyApi] registerCustomers/mobile respondió ${respuesta.status}: ${texto}`);
    return { status: 'unreachable' };
  }

  const datos = await respuesta.json().catch(() => null);
  return { status: 'ok', id: datos?.id ?? null };
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
