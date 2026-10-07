import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

import { ApiError, apiFetch } from './api';
import { db } from './firebase';
import {
  errorDireccion, errorFechaNacimiento, errorNombre, errorTelefono,
} from '../utils/validaciones';

// El perfil que se muestra y se edita en la app (pantalla Perfil) sale de la
// API: MongoDB es la fuente de verdad. Pero al REGISTRARSE el correo todavía no
// está verificado y la API no deja crear el cliente, así que los datos del
// formulario (nombre, apellido, teléfono, dirección, fecha de nacimiento) se
// guardan en Firestore (users/{uid}). Esta función es el puente: los copia a
// Mongo UNA vez, en cuanto el correo está verificado. Después ya no hace nada;
// la pantalla Perfil trabaja directo con la API.
//
// Tiene que esperar a la verificación: el backend solo crea o vincula el
// cliente de Mongo con un correo verificado (Firebase deja crear cuentas con
// cualquier correo, y sin esa condición se podría tomar una cuenta ajena).
//
// Se intenta de nuevo cada vez que la app vuelve a primer plano (por ejemplo,
// al volver del enlace de verificación del correo) hasta que se logra. No pisa
// un perfil que ya tiene nombre y apellido (una cuenta de la web existente).
// Nunca tira: es best-effort y no puede romper nada.
//
// Devuelve true si el perfil de Mongo ya quedó completo.
export async function sincronizarPerfilEnMongo(usuario) {
  try {
    const clave = `perfil_sincronizado_${usuario.uid}`;
    if (await AsyncStorage.getItem(clave)) return true;

    if (!usuario.emailVerified) {
      // El dato guardado en el celular puede estar viejo: se consulta a Firebase
      await usuario.reload();
      if (!usuario.emailVerified) return false;
      await usuario.getIdToken(true);
    }

    // Esta llamada crea el cliente en Mongo (o lo vincula por correo verificado)
    const actual = await apiFetch('/profile', { auth: true });
    if (actual.name && actual.name !== 'Cliente' && actual.lastName) {
      await AsyncStorage.setItem(clave, '1');
      return true;
    }

    const snap = await getDoc(doc(db, 'users', usuario.uid));
    if (!snap.exists()) return false;

    const perfil = snap.data();
    const nacimiento = perfil.birthdate?.toDate ? perfil.birthdate.toDate() : perfil.birthdate ?? null;

    // El servidor rechaza todo el PUT si UN campo no sirve (400). Con datos
    // viejos de Firestore (por ejemplo un teléfono con otro formato) eso
    // repetiría el intento para siempre, así que se mandan solo los campos que
    // pasan las reglas; los demás los completa la persona en su perfil.
    const body = {};
    if (!errorNombre(perfil.name, 'nombre')) body.name = perfil.name.trim();
    if (!errorNombre(perfil.lastName, 'apellido')) body.lastName = perfil.lastName.trim();
    if (!errorTelefono(perfil.phone)) body.phone = perfil.phone.trim();
    if (!errorDireccion(perfil.address)) body.address = perfil.address.trim();
    if (!errorFechaNacimiento(nacimiento)) body.birthdate = nacimiento;

    if (Object.keys(body).length > 0) {
      await apiFetch('/profile', { method: 'PUT', auth: true, body });
    }

    await AsyncStorage.setItem(clave, '1');
    return true;
  } catch (error) {
    // Un 400 es definitivo (repetirlo no lo arregla); cualquier otro fallo se reintenta
    if (error instanceof ApiError && error.status === 400) {
      await AsyncStorage.setItem(`perfil_sincronizado_${usuario.uid}`, '1').catch(() => {});
    }
    console.warn('[perfilSync] No se pudo sincronizar el perfil con el servidor:', error.message);
    return false;
  }
}
