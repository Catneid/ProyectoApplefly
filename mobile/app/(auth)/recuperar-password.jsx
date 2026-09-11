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

export default function RecuperarPassword() {
  const { recuperarPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const manejarSubmit = async () => {
    setError('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Ingresá un correo válido');
      return;
    }

    setEnviando(true);
    try {
      // Firebase manda su propio correo con el link para elegir una
      // contraseña nueva: reemplaza toda la pantalla de "verificar código".
      await recuperarPassword(email.trim());
      setEnviado(true);
    } catch (e) {
      setError(mensajeErrorFirebase(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreen
      title="Recuperar contraseña"
      subtitle="Te enviamos un enlace para crear una nueva contraseña"
      footer={
        <Link href="/(auth)/login" style={styles.link}>
          Volver a iniciar sesión
        </Link>
      }
    >
      {enviado ? (
        <Text style={styles.exito}>
          Listo. Revisá tu correo ({email.trim()}) y seguí el enlace para crear una nueva
          contraseña.
        </Text>
      ) : (
        <>
          <TextField
            label="Correo electrónico"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={error}
          />
          <PrimaryButton
            title={enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            onPress={manejarSubmit}
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
  exito: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.success,
    textAlign: 'center',
    lineHeight: 22,
  },
});
