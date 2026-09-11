import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../src/components/PrimaryButton';
import TextField from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../src/services/firebase';
import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';

// Misma info que muestra public/frontend/src/screens/Contacto.jsx.
const INFO_CONTACTO = [
  { icono: 'location-outline', label: 'Dirección', valor: 'Avenida Principal #123, San Salvador, El Salvador' },
  { icono: 'call-outline', label: 'Teléfono', valor: '+503 2222-3333' },
  { icono: 'mail-outline', label: 'Correo electrónico', valor: 'info@applefly.com' },
  { icono: 'time-outline', label: 'Horario', valor: 'Lun - Vie: 8:00am - 6:00pm\nSáb: 9:00am - 2:00pm' },
];

export default function Contacto() {
  const { user } = useAuth();

  const [form, setForm] = useState({ name: '', email: user?.email || '', message: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const actualizar = (campo) => (valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const validar = () => {
    const nuevos = {};
    if (!form.name.trim()) nuevos.name = 'El nombre es requerido';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nuevos.email = 'Correo inválido';
    if (!form.message.trim()) nuevos.message = 'El mensaje es requerido';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async () => {
    if (!validar()) return;

    setEnviando(true);
    try {
      // Colección propia de mobile: no es la misma "Contacto" (simulada,
      // sin backend) que tiene la web hoy.
      await addDoc(collection(db, 'contactMessages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        createdAt: serverTimestamp(),
      });
      setEnviado(true);
    } catch (e) {
      Alert.alert('No se pudo enviar tu mensaje', 'Intentá de nuevo en unos minutos.');
    } finally {
      setEnviando(false);
    }
  };

  const enviarOtro = () => {
    setForm({ name: '', email: user?.email || '', message: '' });
    setErrores({});
    setEnviado(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Contáctanos',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: sizes.base },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
      {enviado ? (
        <View style={styles.exito}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.exitoTitulo}>¡Gracias!</Text>
          <Text style={styles.exitoTexto}>Te vamos a contactar pronto.</Text>
          <PrimaryButton title="Enviar otro mensaje" onPress={enviarOtro} style={styles.exitoBoton} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.titulo}>Contáctanos</Text>
          <Text style={styles.subtitulo}>
            Estamos aquí para resolver tus dudas. Escribinos y te responderemos lo antes posible.
          </Text>

          <View style={styles.infoCard}>
            {INFO_CONTACTO.map((info) => (
              <View key={info.label} style={styles.infoFila}>
                <View style={styles.infoIcono}>
                  <Ionicons name={info.icono} size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTexto}>
                  <Text style={styles.infoLabel}>{info.label}</Text>
                  <Text style={styles.infoValor}>{info.valor}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.seccionTitulo}>Enviános un mensaje</Text>

          <TextField
            label="Nombre completo"
            value={form.name}
            onChangeText={actualizar('name')}
            error={errores.name}
          />
          <TextField
            label="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={form.email}
            onChangeText={actualizar('email')}
            error={errores.email}
          />
          <TextField
            label="Mensaje"
            placeholder="Contanos cómo podemos ayudarte..."
            multiline
            numberOfLines={5}
            style={styles.textarea}
            value={form.message}
            onChangeText={actualizar('message')}
            error={errores.message}
          />

          <PrimaryButton
            title={enviando ? 'Enviando...' : 'Enviar mensaje'}
            onPress={enviar}
            loading={enviando}
          />
        </ScrollView>
      )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
  },
  subtitulo: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: sizes.sm * 1.4,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  infoFila: {
    flexDirection: 'row',
    gap: 12,
  },
  infoIcono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTexto: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  infoValor: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.4,
  },
  seccionTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  exito: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 40,
    backgroundColor: colors.bg,
  },
  exitoTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    marginTop: 8,
  },
  exitoTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  exitoBoton: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
});
