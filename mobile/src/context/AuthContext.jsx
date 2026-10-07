import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import { loginLegacy, perfilLegacy, vincularCuentaWebUnaVez } from '../services/legacyApi';
import { sincronizarPerfilEnMongo } from '../services/perfilSync';
import { registrarPushToken } from '../services/pushNotifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Mientras revalidamos la sesión todavía no sabemos si el usuario sigue
  // dentro. Sin esta bandera, una ruta protegida lo mandaría al login por
  // un instante antes de confirmarlo, y se vería como un parpadeo.
  const [cargando, setCargando] = useState(true);

  // onAuthStateChanged es la única fuente de verdad: dispara al abrir la
  // app (ya con la sesión restaurada desde AsyncStorage) y cada vez que
  // cambia el login, sin que nosotros tengamos que sincronizar nada a mano.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCargando(false);

      // Best-effort y en segundo plano: no bloquea el login ni el resto de
      // la app si falla (permiso denegado, sin projectId de EAS, etc.).
      if (firebaseUser) {
        registrarPushToken(firebaseUser.uid);
        sincronizarPerfilEnMongo(firebaseUser);
      }
    });

    // Al volver a la app (p. ej. después de abrir el enlace de verificación del
    // correo) se reintenta copiar el perfil a Mongo si todavía no se pudo.
    const suscripcionAppState = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && auth.currentUser) {
        sincronizarPerfilEnMongo(auth.currentUser);
      }
    });

    return () => {
      unsubscribe();
      suscripcionAppState.remove();
    };
  }, []);

  const register = async ({ name, lastName, birthdate, email, password, phone, address }) => {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);

    // Al backend no se le manda nada en el registro (ni la contraseña): el
    // cliente de MongoDB se crea, o se vincula con una cuenta de la web que ya
    // exista con ese correo, recién cuando el correo está VERIFICADO (ver
    // verifyToken en public/backend y src/services/perfilSync.js). Hasta
    // entonces se puede explorar la app, pero no comprar ni ver pedidos.
    await sendEmailVerification(credencial.user);

    // Firebase Auth solo guarda email/uid/password; el resto de los datos
    // del cliente vive en Firestore, en un documento con el mismo uid.
    await setDoc(doc(db, 'users', credencial.user.uid), {
      name,
      lastName,
      birthdate,
      phone,
      address,
      createdAt: serverTimestamp(),
    });

    return credencial.user;
  };

  const login = async ({ email, password }) => {
    try {
      const credencial = await signInWithEmailAndPassword(auth, email, password);
      // En segundo plano: no demora ni puede romper el login
      vincularCuentaWebUnaVez(credencial.user, password);
      return credencial.user;
    } catch (errorFirebase) {
      // No podemos confiar en el código de error para saber si la cuenta
      // existe: la protección contra enumeración de Firebase devuelve el
      // mismo "invalid-credential" tanto si no existe como si la contraseña
      // está mal. Probamos contra el login clásico (Mongo) como respaldo,
      // por si es alguien que se registró en la web y todavía no tiene
      // cuenta espejo en Firebase.
      const cuentaWeb = await loginLegacy(email, password);
      if (!cuentaWeb) throw errorFirebase;

      try {
        // Mongo ya validó la contraseña: creamos la cuenta espejo para que
        // de acá en adelante entre por el camino normal de Firebase.
        const credencial = await createUserWithEmailAndPassword(auth, email, password);

        // La cuenta espejo nace con el correo SIN verificar. Se manda el correo
        // de verificación (igual que en el registro) para que la persona pueda
        // comprar y ver sus pedidos. Best-effort: si falla no se rompe el login,
        // se puede reenviar desde la app.
        try {
          await sendEmailVerification(credencial.user);
        } catch (errorCorreo) {
          console.warn('[auth] No se pudo enviar el correo de verificación:', errorCorreo.message);
        }

        const perfil = await perfilLegacy();

        await setDoc(doc(db, 'users', credencial.user.uid), {
          name: perfil?.name ?? cuentaWeb.name ?? '',
          lastName: perfil?.lastName ?? '',
          birthdate: perfil?.birthdate ?? null,
          phone: perfil?.phone ?? '',
          address: perfil?.address ?? '',
          createdAt: perfil?.createdAt ?? serverTimestamp(),
          migradoDesdeWeb: true,
        });

        // Mongo acaba de validar esta contraseña: es la prueba para vincular
        vincularCuentaWebUnaVez(credencial.user, password);
        return credencial.user;
      } catch (errorCrear) {
        if (errorCrear.code === 'auth/email-already-in-use') {
          // Ya existe una cuenta de Firebase con este email pero con OTRA
          // contraseña (por ejemplo, alguien la cambió en un solo lado).
          // No podemos resolverlo solos desde el cliente.
          throw new Error(
            'Tu contraseña cambió recientemente y no coincide entre la web y la app. Recuperala con "¿Olvidaste tu contraseña?".'
          );
        }
        throw errorCrear;
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, cargando, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
