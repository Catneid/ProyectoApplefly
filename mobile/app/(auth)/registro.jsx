import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import AuthScreen from '../../src/components/AuthScreen';
import TextField from '../../src/components/TextField';
import DateField from '../../src/components/DateField';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { mensajeErrorFirebase } from '../../src/services/firebaseErrors';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

export default function Registro() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [birthdate, setBirthdate] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const actualizar = (campo) => (valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const validar = () => {
    const nuevos = {};
    if (!form.name.trim() || form.name.trim().length < 2) nuevos.name = 'Mínimo 2 caracteres';
    if (!form.email.trim()) nuevos.email = 'El correo es requerido';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nuevos.email = 'Correo inválido';
    if (!form.password || form.password.length < 6) nuevos.password = 'Mínimo 6 caracteres';
    if (form.confirmPassword !== form.password) nuevos.confirmPassword = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const manejarSubmit = async () => {
    setErrorGeneral('');
    if (!validar()) return;

    setEnviando(true);
    try {
      await register({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        birthdate,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      // No bloqueamos el uso de la app: solo se lo recordamos. El Alert
      // queda arriba de todo aunque el layout de (auth) ya haya redirigido
      // al home (createUserWithEmailAndPassword deja la sesión iniciada).
      Alert.alert(
        'Revisá tu correo',
        'Te enviamos un enlace para verificar tu cuenta. Podés seguir usando la app mientras tanto.'
      );
    } catch (e) {
      setErrorGeneral(mensajeErrorFirebase(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreen
      title="Crear cuenta"
      subtitle="Únete a Applefly y obtén ofertas exclusivas"
      footer={
        <Text style={styles.alt}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Inicia sesión
          </Link>
        </Text>
      }
    >
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Nombre"
            placeholder="Tu nombre"
            value={form.name}
            onChangeText={actualizar('name')}
            error={errores.name}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="Apellido"
            placeholder="Tu apellido"
            value={form.lastName}
            onChangeText={actualizar('lastName')}
          />
        </View>
      </View>

      <TextField
        label="Correo electrónico"
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        onChangeText={actualizar('email')}
        error={errores.email}
      />

      <DateField label="Fecha de nacimiento" value={birthdate} onChange={setBirthdate} />

      <TextField
        label="Teléfono"
        placeholder="Tu teléfono"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={actualizar('phone')}
      />

      <TextField
        label="Dirección"
        placeholder="Tu dirección"
        value={form.address}
        onChangeText={actualizar('address')}
      />

      <TextField
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        autoCapitalize="none"
        value={form.password}
        onChangeText={actualizar('password')}
        error={errores.password}
      />

      <TextField
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        value={form.confirmPassword}
        onChangeText={actualizar('confirmPassword')}
        error={errores.confirmPassword}
      />

      {errorGeneral ? <Text style={styles.errorGeneral}>{errorGeneral}</Text> : null}

      <PrimaryButton
        title={enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        onPress={manejarSubmit}
        loading={enviando}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
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
