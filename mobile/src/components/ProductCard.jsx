import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

// Mismo cálculo que TelefonoCard.jsx de la web: si el producto no trae un
// "discount" explícito, lo derivamos de originalPrice vs price.
const calcularDescuento = (producto) => {
  if (producto.discount > 0) return producto.discount;
  if (producto.originalPrice) {
    return Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100);
  }
  return 0;
};

// Tarjeta de producto: imagen, nombre, precio (con el original tachado si
// hay descuento) y badges de condición/descuento. Se reusa en Inicio
// (destacados) y en Catálogo. onPress es opcional a propósito: todavía no
// existe una pantalla de detalle de producto a la que navegar.
export default function ProductCard({ producto, onPress, style }) {
  const descuento = calcularDescuento(producto);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed, style]}
      onPress={onPress}
    >
      <View style={styles.imagenWrapper}>
        {producto.image ? (
          <Image
            source={{ uri: producto.image }}
            style={styles.imagen}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.imagen, styles.imagenPlaceholder]}>
            <Text style={styles.imagenPlaceholderTexto}>📦</Text>
          </View>
        )}

        {descuento > 0 && (
          <View style={styles.badgeDescuento}>
            <Text style={styles.badgeDescuentoTexto}>-{descuento}%</Text>
          </View>
        )}

        <View style={styles.badgeCondicion}>
          <Text style={styles.badgeCondicionTexto}>{producto.condition || 'Nuevo'}</Text>
        </View>
      </View>

      <View style={styles.info}>
        {producto.categoryName ? <Text style={styles.categoria}>{producto.categoryName}</Text> : null}

        <Text style={styles.nombre} numberOfLines={2}>
          {producto.name}
        </Text>

        {(producto.storage || producto.ram) && (
          <Text style={styles.specs} numberOfLines={1}>
            {[producto.storage, producto.ram && `${producto.ram} RAM`].filter(Boolean).join(' • ')}
          </Text>
        )}

        <View style={styles.precios}>
          <Text style={styles.precio}>${Number(producto.price ?? 0).toFixed(2)}</Text>
          {descuento > 0 && producto.originalPrice ? (
            <Text style={styles.precioOriginal}>${Number(producto.originalPrice).toFixed(2)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const ANCHO_TARJETA = 168;

const styles = StyleSheet.create({
  card: {
    width: ANCHO_TARJETA,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  imagenWrapper: {
    width: '100%',
    height: ANCHO_TARJETA,
    backgroundColor: colors.surfaceAlt,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  imagenPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenPlaceholderTexto: {
    fontSize: 32,
  },
  badgeDescuento: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.danger,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeDescuentoTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.xs,
    color: colors.white,
  },
  badgeCondicion: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCondicionTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
    color: colors.primaryDark,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  categoria: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  nombre: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
    minHeight: 34,
  },
  specs: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
  precios: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  precio: {
    fontFamily: fonts.bold,
    fontSize: sizes.base,
    color: colors.text,
  },
  precioOriginal: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textDim,
    textDecorationLine: 'line-through',
  },
});
