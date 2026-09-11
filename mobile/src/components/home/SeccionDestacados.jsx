import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import ProductCard from '../ProductCard';
import { colors } from '../../theme/colors';
import { fonts, sizes } from '../../theme/typography';

export default function SeccionDestacados({ productos }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Productos destacados</Text>
          <Text style={styles.subtitulo}>Los favoritos de nuestros clientes</Text>
        </View>
        <Link href="/(tabs)/catalogo" style={styles.verTodo}>
          Ver todos →
        </Link>
      </View>

      {productos.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay productos destacados cargados.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fila}
        >
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              onPress={() => router.push(`/producto/${producto.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 28,
    paddingLeft: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 20,
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
  },
  verTodo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
  vacio: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textDim,
    paddingVertical: 12,
    paddingRight: 20,
  },
  fila: {
    gap: 12,
    paddingVertical: 16,
    paddingRight: 20,
  },
});
