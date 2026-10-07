import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

import { apiFetch } from './api';
import { db } from './firebase';

// El cliente vive en MongoDB (pedidos, reseñas, panel de administración), pero
// los datos que la persona escribe al registrarse en la app (nombre, apellido,
// teléfono, dirección, fecha de nacimiento) quedan en su perfil de Firestore
// (users/{uid}). Esta función los copia a Mongo UNA vez, en cuanto el correo
// está verificado.
//
// Tiene que esperar a la verificación: el backend solo crea o vincula el
// cliente de Mongo con un correo verificado (Firebase deja crear cuentas con
// cualquier correo, y sin esa condición se podría tomar una cuenta ajena). Por
// eso ya no se manda nada al backend al registrarse, ni la contraseña.
//
// Se intenta de nuevo cada vez que la app vuelve a primer plano (por ejemplo,
// al volver del enlace de verificación del correo) hasta que se logra. No pisa
// un perfil que ya tiene nombre y apellido (una cuenta de la web existente).
// Nunca tira: es best-effort y no puede romper nada.
export async function sincronizarPerfilEnMongo(usuario) {
  try {
    const clave = `perfil_sincronizado_${usuario.uid}`;
    if (await AsyncStorage.getItem(clave)) return;

    if (!usuario.emailVerified) {
      // El dato guardado en el celular puede estar viejo: se consulta a Firebase
      await usuario.reload();
      if (!usuario.emailVerified) return;
      await usuario.getIdToken(true);
    }

    // Esta llamada crea el cliente en Mongo (o lo vincula por correo verificado)
    const actual = await apiFetch('/profile', { auth: true });
    if (actual.name && actual.name !== 'Cliente' && actual.lastName) {
      await AsyncStorage.setItem(clave, '1');
      return;
    }

    const snap = await getDoc(doc(db, 'users', usuario.uid));
    if (!snap.exists()) return;

    const perfil = snap.data();
    await apiFetch('/profile', {
      method: 'PUT',
      auth: true,
      body: {
        name: perfil.name,
        lastName: perfil.lastName,
        phone: perfil.phone,
        address: perfil.address,
        birthdate: perfil.birthdate?.toDate ? perfil.birthdate.toDate() : perfil.birthdate ?? null,
      },
    });

    await AsyncStorage.setItem(clave, '1');
  } catch (error) {
    console.warn('[perfilSync] No se pudo sincronizar el perfil con el servidor:', error.message);
  }
}
