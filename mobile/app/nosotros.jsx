import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../src/components/PrimaryButton';
import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';

// Mismo contenido que public/frontend/src/screens/Nosotros.jsx, adaptado a
// una pantalla de scroll nativa (sin copiar el JSX de la web).
const PILARES = [
  {
    icono: 'flag-outline',
    titulo: 'Misión',
    texto: 'Ofrecer dispositivos Apple reacondicionados de alta calidad con garantía, democratizando el acceso a la tecnología premium.',
  },
  {
    icono: 'eye-outline',
    titulo: 'Visión',
    texto: 'Ser el líder regional en venta de dispositivos Apple reacondicionados, promoviendo el consumo consciente y la economía circular.',
  },
  {
    icono: 'heart-outline',
    titulo: 'Valores',
    texto: 'Transparencia, calidad, responsabilidad ambiental y servicio excepcional al cliente.',
  },
];

const PASOS = [
  { titulo: 'Inspección inicial', texto: 'Diagnóstico completo del hardware y software.' },
  { titulo: 'Reparación y reemplazo', texto: 'Cambio de piezas dañadas por repuestos originales.' },
  { titulo: 'Limpieza profunda', texto: 'Higienización y pulido profesional del dispositivo.' },
  { titulo: 'Pruebas de calidad', texto: 'Más de 30 pruebas de funcionamiento y rendimiento.' },
  { titulo: 'Certificación y garantía', texto: 'Sello de calidad y garantía de 12 meses.' },
];

const EQUIPO = [
  { nombre: 'Gabriel Ramirez', iniciales: 'GR' },
  { nombre: 'Carlos Salinas', iniciales: 'CS' },
  { nombre: 'David Iglesias', iniciales: 'DI' },
  { nombre: 'Isaac Ramos', iniciales: 'IR' },
];

export default function Nosotros() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nosotros',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: sizes.base },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.etiqueta}>Nuestra historia</Text>
          <Text style={styles.heroTitulo}>Aliviando tu bolsillo, cuidando el planeta</Text>
          <Text style={styles.heroTexto}>
            En Applefly creemos que todos merecen acceso a tecnología de calidad, a precios justos y
            con responsabilidad ambiental.
          </Text>
        </View>

        <View style={styles.pilares}>
          {PILARES.map((p) => (
            <View key={p.titulo} style={styles.pilarCard}>
              <View style={styles.pilarIcono}>
                <Ionicons name={p.icono} size={26} color={colors.primary} />
              </View>
              <Text style={styles.pilarTitulo}>{p.titulo}</Text>
              <Text style={styles.pilarTexto}>{p.texto}</Text>
            </View>
          ))}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Nuestro proceso de reacondicionamiento</Text>
          <Text style={styles.seccionIntro}>
            Cada equipo pasa por un riguroso proceso de 5 etapas antes de llegar a ti.
          </Text>

          {PASOS.map((paso, indice) => (
            <View key={paso.titulo} style={styles.paso}>
              <View style={styles.pasoNumero}>
                <Text style={styles.pasoNumeroTexto}>{indice + 1}</Text>
              </View>
              <View style={styles.pasoTexto}>
                <Text style={styles.pasoTitulo}>{paso.titulo}</Text>
                <Text style={styles.pasoDescripcion}>{paso.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Nuestro equipo</Text>
          <Text style={styles.seccionIntro}>
            Somos un grupo de jóvenes apasionados por la tecnología y el emprendimiento.
          </Text>

          <View style={styles.equipo}>
            {EQUIPO.map((m) => (
              <View key={m.nombre} style={styles.miembro}>
                <View style={styles.miembroAvatar}>
                  <Text style={styles.miembroAvatarTexto}>{m.iniciales}</Text>
                </View>
                <Text style={styles.miembroNombre}>{m.nombre}</Text>
                <Text style={styles.miembroRol}>Desarrollo de Software</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaTitulo}>¿Listo para encontrar tu próximo Apple?</Text>
          <Text style={styles.ctaTexto}>Explorá nuestro catálogo y encontrá la mejor opción para vos.</Text>
          <PrimaryButton title="Ver catálogo" onPress={() => router.push('/(tabs)/catalogo')} style={styles.ctaBoton} />
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  hero: {
    padding: 20,
    paddingTop: 24,
    gap: 8,
  },
  etiqueta: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  heroTitulo: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xxl,
    color: colors.text,
  },
  heroTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.5,
  },
  pilares: {
    paddingHorizontal: 20,
    gap: 12,
  },
  pilarCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  pilarIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilarTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.base,
    color: colors.text,
  },
  pilarTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.4,
  },
  seccion: {
    padding: 20,
    gap: 4,
  },
  seccionTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
  },
  seccionIntro: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginBottom: 12,
  },
  paso: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pasoNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumeroTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.sm,
    color: colors.white,
  },
  pasoTexto: {
    flex: 1,
    gap: 2,
  },
  pasoTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  pasoDescripcion: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  equipo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  miembro: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 20,
    gap: 4,
  },
  miembroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  miembroAvatarTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.base,
    color: colors.primaryDark,
  },
  miembroNombre: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
  miembroRol: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
  cta: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    gap: 6,
  },
  ctaTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
    textAlign: 'center',
  },
  ctaTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  ctaBoton: {
    marginTop: 10,
    alignSelf: 'stretch',
  },
});
