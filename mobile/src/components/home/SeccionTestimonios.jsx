import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Estrellas from '../Estrellas';
import { colors } from '../../theme/colors';
import { fonts, sizes } from '../../theme/typography';

// Mismos testimonios que public/frontend/src/data/testimonials.js. Estático
// por ahora — se puede conectar a Firestore más adelante si hace falta.
const TESTIMONIOS = [
  {
    id: 1,
    name: 'María González',
    role: 'Clienta verificada',
    text: 'Compré un iPhone 13 en Applefly y quedé encantada. Llegó en condiciones excelentes, como describían. Totalmente recomendado.',
    rating: 5,
    avatar: 'MG',
  },
  {
    id: 2,
    name: 'Carlos Rivera',
    role: 'Cliente frecuente',
    text: 'Excelente atención al cliente y precios muy justos. Ya es mi tercera compra y nunca me han fallado.',
    rating: 5,
    avatar: 'CR',
  },
  {
    id: 3,
    name: 'Laura Méndez',
    role: 'Clienta verificada',
    text: 'Me sorprendió la calidad del iPhone 14 reacondicionado. Parece nuevo y con un descuento enorme.',
    rating: 4,
    avatar: 'LM',
  },
  {
    id: 4,
    name: 'José Ramos',
    role: 'Cliente verificado',
    text: 'Entrega rápida y el equipo viene con garantía. La experiencia fue muy profesional.',
    rating: 5,
    avatar: 'JR',
  },
];

export default function SeccionTestimonios() {
  return (
    <View style={styles.section}>
      <Text style={styles.titulo}>Lo que dicen nuestros clientes</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
        {TESTIMONIOS.map((t) => (
          <View key={t.id} style={styles.card}>
            <Estrellas cantidad={t.rating} tamano={14} />
            <Text style={styles.texto} numberOfLines={5}>
              "{t.text}"
            </Text>
            <View style={styles.autor}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>{t.avatar}</Text>
              </View>
              <View>
                <Text style={styles.nombre}>{t.name}</Text>
                <Text style={styles.rol}>{t.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const ANCHO_TARJETA = 260;

const styles = StyleSheet.create({
  section: {
    paddingTop: 32,
    paddingBottom: 8,
    paddingLeft: 20,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    marginBottom: 16,
    paddingRight: 20,
  },
  fila: {
    gap: 12,
    paddingRight: 20,
  },
  card: {
    width: ANCHO_TARJETA,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  texto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.text,
    lineHeight: sizes.sm * 1.4,
  },
  autor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
    color: colors.primaryDark,
  },
  nombre: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  rol: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
});
