import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import { loginLegacy, perfilLegacy, registrarEnMongo } from '../services/legacyApi';
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
      }
    });

    return unsubscribe;
  }, []);

  const register = async ({ name, lastName, birthdate, email, password, phone, address }) => {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);

    // El backend valida este token para confirmar que el firebaseUid del
    // body es realmente el uid de quien llama, no uno inventado.
    const idToken = await credencial.user.getIdToken();

    // Espejo en Mongo, para que la misma cuenta sirva también para
    // loguearse en la web. Es best-effort: si el backend clásico no
    // responde (URL sin configurar, sin red), seguimos igual con la cuenta
    // de Firebase sola. Lo único que sí frena el alta es un conflicto real.
    const resultadoMongo = await registrarEnMongo({
      name,
      lastName,
      birthdate,
      email,
      password,
      phone,
      address,
      firebaseUid: credencial.user.uid,
      idToken,
    });

    if (resultadoMongo.status === 'conflict') {
      // Ya existía una cuenta de la web con este correo (con otra
      // contraseña, seguramente). No la pisamos: deshacemos el alta de
      // Firebase en vez de dejar dos identidades sueltas para el mismo email.
      await credencial.user.delete();
      throw new Error('Ya existe una cuenta con este correo. Iniciá sesión en lugar de registrarte.');
    }

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
      mongoId: resultadoMongo.id ?? null,
    });

    return credencial.user;
  };

  const login = async ({ email, password }) => {
    try {
      const credencial = await signInWithEmailAndPassword(auth, email, password);
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

  // Reemplaza toda la pantalla de "verificar código" de la web: Firebase
  // manda su propio correo con un link para elegir una contraseña nueva.
  const recuperarPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{ user, cargando, register, login, logout, recuperarPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
