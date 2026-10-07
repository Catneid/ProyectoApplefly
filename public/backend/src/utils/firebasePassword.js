import { getFirebaseAuth } from "../config/firebaseAdmin.js";

// Cuando un cliente cambia su contraseña en la web (recuperación o "cambiar
// contraseña" del perfil), la de Firebase tiene que cambiar igual: la app entra
// con Firebase, y si conserva la vieja la persona queda fuera de la app (o,
// peor, la contraseña vieja sigue sirviendo ahí).
//
// Se busca el usuario de Firebase:
//   1. por el firebaseUid que tiene el cliente en Mongo; si no tiene,
//   2. por correo, pero SOLO si Firebase lo marca como verificado. Firebase deja
//      crear una cuenta con el correo de otra persona sin comprobarlo; una
//      cuenta sin verificar con ese correo no es de quien acaba de recuperar
//      la contraseña y no se toca.
//
// Nunca tira: si Firebase falla (sin configurar, sin red, etc.) solo queda en
// el log y el cambio de contraseña de la web sigue valiendo. Devuelve true si
// se actualizó la de Firebase.
export const sincronizarPasswordEnFirebase = async (cliente, email, password) => {
  try {
    const auth = getFirebaseAuth();
    let uid = cliente?.firebaseUid;

    if (!uid) {
      try {
        const usuario = await auth.getUserByEmail(email);
        if (usuario.emailVerified) uid = usuario.uid;
      } catch (error) {
        // Sin cuenta en Firebase (persona que solo usa la web): es lo normal
        if (error?.code !== "auth/user-not-found") throw error;
      }
    }

    if (!uid) return false;

    await auth.updateUser(uid, { password });
    return true;
  } catch (error) {
    console.log("[firebase] No se pudo actualizar la contraseña en Firebase:", error?.code || error?.message);
    return false;
  }
};
