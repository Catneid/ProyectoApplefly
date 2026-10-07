import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Link, router } from 'expo-router';

import AuthScreen from '../src/components/AuthScreen';
import TextField from '../src/components/TextField';
import PrimaryButton from '../src/components/PrimaryButton';
import { useAuth } from '../src/context/AuthContext';
import {
  cambiarPasswordRecuperacion,
  pedirCodigoRecuperacion,
  verificarCodigoRecuperacion,
} from '../src/services/recoveryApi';
import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';
import { esCorreo } from '../src/utils/validaciones';

const PASSWORD_MIN = 6;

const SUBTITULOS = {
  1: 'Paso 1 de 3: te enviamos un código a tu correo',
  2: 'Paso 2 de 3: escribe el código de 6 dígitos',
  3: 'Paso 3 de 3: elige tu nueva contraseña',
};

// Esta pantalla está fuera del grupo (auth) a propósito: se usa desde el login
// ("¿Olvidaste tu contraseña?") y también desde el perfil, con la sesión
// iniciada, y el layout de (auth) saca de ahí a quien ya tiene sesión.
//
// El flujo es el mismo de la web, contra la API (/api/recoveryPassword):
// correo -> código de 6 dígitos -> contraseña nueva. El backend devuelve un
// token en cada paso y esta pantalla lo manda de vuelta en X-Recovery-Token.
export default function RecuperarPassword() {
  const { user } = useAuth();

  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState(user?.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  // Token de recuperación vigente (el del paso 1, y luego el "verificado")
  const [token, setToken] = useState(null);

  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // Paso 1: pide el código. Siempre responde igual, exista o no la cuenta.
  const pedirCodigo = async () => {
    setErrores({});
    if (!esCorreo(email)) {
      setErrores({ email: 'Ingresa un correo válido' });
      return;
    }

    setEnviando(true);
    try {
      const datos = await pedirCodigoRecuperacion(email.trim());
      setToken(datos.token);
      setCodigo('');
      setAviso(`${datos.message}. Revisa tu correo (${email.trim()}); el código vale 15 minutos.`);
      setPaso(2);
    } catch (e) {
      setErrores({ email: e.message });
    } finally {
      setEnviando(false);
    }
  };

  // "Reenviar código": pide uno nuevo con el mismo correo. El anterior queda
  // sin efecto (el token nuevo reemplaza al viejo). El servidor manda como
  // máximo 3 por hora a cada correo.
  const reenviarCodigo = async () => {
    setErrores({});
    setReenviando(true);
    try {
      const datos = await pedirCodigoRecuperacion(email.trim());
      setToken(datos.token);
      setCodigo('');
      setAviso(`${datos.message}. Usa el último que te llegue.`);
    } catch (e) {
      setErrores({ codigo: e.message });
    } finally {
      setReenviando(false);
    }
  };

  // Paso 2: verifica el código. El servidor cuenta los intentos (máximo 5).
  const verificarCodigo = async () => {
    setErrores({});
    if (!/^\d{6}$/.test(codigo)) {
      setErrores({ codigo: 'El código tiene 6 dígitos' });
      return;
    }
    if (!token) {
      setErrores({ codigo: 'El código expiró, solicita uno nuevo' });
      return;
    }

    setEnviando(true);
    try {
      const datos = await verificarCodigoRecuperacion(token, codigo);
      setToken(datos.token);
      setAviso('');
      setPaso(3);
    } catch (e) {
      // 429 (demasiados intentos) o 400 "expiró": ese token ya no sirve y
      // hay que pedir otro con "Reenviar código".
      if (e.status === 429 || /expir/i.test(e.message)) setToken(null);
      setErrores({ codigo: e.message });
    } finally {
      setEnviando(false);
    }
  };

  // Paso 3: contraseña nueva. El servidor la cambia en la web y en Firebase.
  const cambiarPassword = async () => {
    const nuevos = {};
    if (password.length < PASSWORD_MIN) nuevos.password = `Mínimo ${PASSWORD_MIN} caracteres`;
    if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await cambiarPasswordRecuperacion(token, password, confirmar);
    } catch (e) {
      if (e.status === 400 && /expir|verificar el c/i.test(e.message)) {
        // El token venció o ya se usó: se vuelve al paso del código
        setToken(null);
        setPaso(2);
        setAviso('');
        setErrores({ codigo: e.message });
      } else {
        setErrores({ password: e.message });
      }
      setEnviando(false);
      return;
    }
    setEnviando(false);

    if (user) {
      // Venía del perfil, con la sesión iniciada
      Alert.alert('Listo', 'Tu contraseña se actualizó.');
      router.replace('/(tabs)/perfil');
    } else {
      router.replace({ pathname: '/(auth)/login', params: { recuperada: '1' } });
    }
  };

  const footer = user ? (
    <Pressable onPress={() => router.back()}>
      <Text style={styles.link}>Cancelar</Text>
    </Pressable>
  ) : (
    <Link href="/(auth)/login" style={styles.link}>
      Volver a iniciar sesión
    </Link>
  );

  return (
    <AuthScreen title="Recuperar contraseña" subtitle={SUBTITULOS[paso]} footer={footer}>
      {paso === 1 && (
        <>
          <TextField
            label="Correo electrónico"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={errores.email}
          />
          <PrimaryButton
            title={enviando ? 'Enviando...' : 'Enviar código'}
            onPress={pedirCodigo}
            loading={enviando}
          />
        </>
      )}

      {paso === 2 && (
        <>
          {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
          <TextField
            label="Código de verificación"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
            value={codigo}
            onChangeText={(valor) => setCodigo(valor.replace(/\D/g, ''))}
            error={errores.codigo}
          />
          <PrimaryButton
            title={enviando ? 'Verificando...' : 'Verificar código'}
            onPress={verificarCodigo}
            loading={enviando}
            disabled={reenviando}
          />
          <Pressable style={styles.reenviar} onPress={reenviarCodigo} disabled={reenviando || enviando}>
            <Text style={styles.link}>{reenviando ? 'Reenviando...' : 'Reenviar código'}</Text>
          </Pressable>
          <Pressable
            style={styles.reenviar}
            onPress={() => {
              setErrores({});
              setAviso('');
              setPaso(1);
            }}
          >
            <Text style={styles.linkSecundario}>Cambiar correo</Text>
          </Pressable>
        </>
      )}

      {paso === 3 && (
        <>
          <TextField
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            error={errores.password}
          />
          <TextField
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            secureTextEntry
            autoCapitalize="none"
            value={confirmar}
            onChangeText={setConfirmar}
            error={errores.confirmar}
          />
          <PrimaryButton
            title={enviando ? 'Guardando...' : 'Cambiar contraseña'}
            onPress={cambiarPassword}
            loading={enviando}
          />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
  linkSecundario: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  reenviar: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  aviso: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
});
