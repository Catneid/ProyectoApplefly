import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../../src/components/PrimaryButton';
import { useCart } from '../../src/context/CartContext';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

function FilaCarrito({ item, onSumar, onRestar, onQuitar }) {
  return (
    <View style={styles.fila}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.imagen} contentFit="cover" />
      ) : (
        <View style={[styles.imagen, styles.imagenPlaceholder]}>
          <Text style={styles.imagenPlaceholderTexto}>📦</Text>
        </View>
      )}

      <View style={styles.filaInfo}>
        <Text style={styles.filaNombre} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.filaPrecio}>${Number(item.price ?? 0).toFixed(2)}</Text>

        <View style={styles.selector}>
          <Pressable style={styles.selectorBoton} onPress={onRestar}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </Pressable>
          <Text style={styles.selectorCantidad}>{item.quantity}</Text>
          <Pressable style={styles.selectorBoton} onPress={onSumar}>
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.quitarBoton} onPress={onQuitar}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

export default function Carrito() {
  const { items, cargando, actualizarCantidad, quitarDelCarrito, subtotal } = useCart();

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.titulo}>Carrito</Text>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.titulo}>Carrito</Text>
        <View style={styles.vacio}>
          <Ionicons name="cart-outline" size={48} color={colors.textDim} />
          <Text style={styles.vacioTitulo}>Tu carrito está vacío</Text>
          <Text style={styles.vacioTexto}>
            Agregá productos desde el catálogo para verlos acá.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.titulo}>Carrito</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <FilaCarrito
            item={item}
            onSumar={() => actualizarCantidad(item.productId, item.quantity + 1)}
            onRestar={() => actualizarCantidad(item.productId, item.quantity - 1)}
            onQuitar={() => quitarDelCarrito(item.productId)}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.subtotalFila}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValor}>${subtotal.toFixed(2)}</Text>
        </View>
        <PrimaryButton title="Ir a pagar" onPress={() => router.push('/checkout')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  vacioTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
    marginTop: 8,
  },
  vacioTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  lista: {
    padding: 20,
    gap: 12,
  },
  fila: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  imagen: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  imagenPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenPlaceholderTexto: {
    fontSize: 24,
  },
  filaInfo: {
    flex: 1,
    gap: 4,
  },
  filaNombre: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  filaPrecio: {
    fontFamily: fonts.bold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  selectorBoton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorCantidad: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  quitarBoton: {
    padding: 6,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  subtotalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  subtotalLabel: {
    fontFamily: fonts.medium,
    fontSize: sizes.base,
    color: colors.textMuted,
  },
  subtotalValor: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xl,
    color: colors.text,
  },
});
