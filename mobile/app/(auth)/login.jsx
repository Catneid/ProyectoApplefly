import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import AuthScreen from '../../src/components/AuthScreen';
import TextField from '../../src/components/TextField';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { mensajeErrorFirebase } from '../../src/services/firebaseErrors';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const validar = () => {
    const nuevos = {};
    if (!email.trim()) nuevos.email = 'El correo es requerido';
    else if (!/^\S+@\S+\.\S+$/.test(email)) nuevos.email = 'Correo inválido';
    if (!password) nuevos.password = 'La contraseña es requerida';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const manejarSubmit = async () => {
    setErrorGeneral('');
    if (!validar()) return;

    setEnviando(true);
    try {
      // No navegamos a mano: en cuanto login() resuelve, onAuthStateChanged
      // actualiza el user y el layout de (auth) redirige solo al home.
      await login({ email: email.trim(), password });
    } catch (e) {
      setErrorGeneral(mensajeErrorFirebase(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreen
      title="Iniciar sesión"
      subtitle="Bienvenido de nuevo a Applefly"
      footer={
        <>
          <Link href="/(auth)/recuperar-password" style={styles.link}>
            ¿Olvidaste tu contraseña?
          </Link>
          <Text style={styles.alt}>
            ¿No tienes cuenta?{' '}
            <Link href="/(auth)/registro" style={styles.link}>
              Regístrate
            </Link>
          </Text>
        </>
      }
    >
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
      <TextField
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        error={errores.password}
      />

      {errorGeneral ? <Text style={styles.errorGeneral}>{errorGeneral}</Text> : null}

      <PrimaryButton
        title={enviando ? 'Iniciando sesión...' : 'Ingresar'}
        onPress={manejarSubmit}
        loading={enviando}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  errorGeneral: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.danger,
    marginBottom: 12,
  },
  alt: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
});
