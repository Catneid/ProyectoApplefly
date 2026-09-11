import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';

import { db } from './firebase';

// Sin esto, expo-notifications no muestra nada mientras la app está
// abierta (su comportamiento por defecto es tragarse la notificación en
// foreground). El push de "pago confirmado" (Fase 8) tiene que verse
// aunque el cliente esté con la app abierta en ese momento.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Pide permiso (si hace falta) y devuelve el Expo push token de este
// dispositivo, o null si no se pudo conseguir. Nunca tira: quedarse sin
// push token no puede romper el login ni ninguna otra pantalla.
async function obtenerPushToken() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const permisoActual = await Notifications.getPermissionsAsync();
    let estado = permisoActual.status;

    if (estado !== 'granted') {
      const solicitado = await Notifications.requestPermissionsAsync();
      estado = solicitado.status;
    }

    if (estado !== 'granted') {
      console.warn('[push] Permiso de notificaciones no concedido.');
      return null;
    }

    // getExpoPushTokenAsync necesita el projectId del proyecto de EAS
    // (app.json > extra.eas.projectId, lo escribe "eas init"). Sin esto no
    // hay forma de conseguir un token real.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn(
        '[push] Falta el projectId de EAS en app.json (extra.eas.projectId) — corré "eas init" primero.'
      );
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (error) {
    // Emulador sin Google Play Services, Expo Go sin soporte de push
    // remoto, permiso denegado a nivel sistema, etc. — todos casos donde
    // seguimos sin push, pero la app tiene que seguir funcionando igual.
    console.warn('[push] No se pudo obtener el push token:', error.message);
    return null;
  }
}

// Pide el token y lo guarda (o actualiza) en users/{uid}.pushToken. Se
// llama cada vez que se confirma una sesión iniciada (ver
// AuthContext.jsx), no solo la primera vez: así, si el token cambia (por
// ejemplo, reinstalaron la app), queda actualizado sin que el cliente
// tenga que hacer nada.
export async function registrarPushToken(uid) {
  const token = await obtenerPushToken();
  if (!token) return;

  try {
    await setDoc(doc(db, 'users', uid), { pushToken: token }, { merge: true });
  } catch (error) {
    console.warn('[push] No se pudo guardar el push token:', error.message);
  }
}
