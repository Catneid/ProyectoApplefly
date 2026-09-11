import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors } from '../../theme/colors';
import { fonts, sizes } from '../../theme/typography';

// Mismo criterio que ICONOS en SeccionCategorias.jsx de la web, pero con
// Ionicons en vez de SVGs a mano.
const ICONOS = {
  iPhone: 'phone-portrait-outline',
  iPad: 'tablet-portrait-outline',
  MacBook: 'laptop-outline',
  'Apple Watch': 'watch-outline',
  AirPods: 'headset-outline',
};

const iconoPara = (nombre) => ICONOS[nombre] || 'cube-outline';

export default function SeccionCategorias({ categorias }) {
  return (
    <View style={styles.section}>
      <Text style={styles.titulo}>Explora por categoría</Text>
      <Text style={styles.subtitulo}>Encuentra el dispositivo Apple perfecto para ti</Text>

      {categorias.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay categorías cargadas.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fila}
        >
          {categorias.map((cat) => (
            <Pressable key={cat.id} style={styles.card} onPress={() => router.push('/(tabs)/catalogo')}>
              <View style={styles.icono}>
                <Ionicons name={iconoPara(cat.name)} size={26} color={colors.primary} />
              </View>
              <Text style={styles.nombre}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 28,
    paddingHorizontal: 20,
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
    marginTop: 2,
    marginBottom: 16,
  },
  vacio: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textDim,
    paddingVertical: 12,
  },
  fila: {
    gap: 12,
    paddingRight: 8,
  },
  card: {
    width: 96,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
});
