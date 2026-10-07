import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoCargando from '../../src/components/EstadoCargando';
import EstadoError from '../../src/components/EstadoError';
import Estrellas from '../../src/components/Estrellas';
import FormularioResena from '../../src/components/FormularioResena';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import {
  crearResena,
  editarResena,
  eliminarResena,
  getProductoPorId,
  getResenasPorProducto,
  puedeResenar,
} from '../../src/services/products';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

const calcularDescuento = (producto) => {
  if (!producto) return 0;
  if (producto.discount > 0) return producto.discount;
  if (producto.originalPrice) {
    return Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100);
  }
  return 0;
};

function FilaSpec({ label, valor }) {
  if (!valor) return null;
  return (
    <View style={styles.filaSpec}>
      <Text style={styles.filaSpecLabel}>{label}</Text>
      <Text style={styles.filaSpecValor}>{valor}</Text>
    </View>
  );
}

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { agregarAlCarrito: agregarProductoAlCarrito } = useCart();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const [resenas, setResenas] = useState([]);
  const [cargandoResenas, setCargandoResenas] = useState(true);
  const [errorResenas, setErrorResenas] = useState(false);

  // Solo quien compró el producto puede reseñarlo (una vez). Lo decide el
  // backend; null mientras carga o si no hay sesión.
  const [permisoResena, setPermisoResena] = useState(null);
  // true mientras se edita la reseña propia (en vez de mostrarla)
  const [editandoResena, setEditandoResena] = useState(false);

  const cargarProducto = async () => {
    try {
      setError(false);
      setCargando(true);
      setProducto(await getProductoPorId(id));
    } catch (e) {
      console.warn('[producto] No se pudo cargar:', e.message);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  const cargarResenas = async () => {
    try {
      setErrorResenas(false);
      setCargandoResenas(true);
      setResenas(await getResenasPorProducto(id));
    } catch (e) {
      console.warn('[producto] No se pudieron cargar las reseñas:', e.message);
      setErrorResenas(true);
    } finally {
      setCargandoResenas(false);
    }
  };

  const cargarPermisoResena = async () => {
    if (!user) {
      setPermisoResena(null);
      return;
    }
    try {
      setPermisoResena(await puedeResenar(id));
    } catch (e) {
      // Sin permiso (p. ej. correo sin verificar): no mostramos el formulario
      setPermisoResena({ comprado: false, puedeResenar: false, miReview: null, motivo: e.message });
    }
  };

  useEffect(() => {
    cargarProducto();
    cargarResenas();
  }, [id]);

  useEffect(() => {
    cargarPermisoResena();
  }, [id, user]);

  const agotado = !!producto && Number(producto.stock ?? 0) <= 0;

  const agregarAlCarrito = () => {
    const { agregadas, motivo } = agregarProductoAlCarrito(producto, 1);

    if (agregadas > 0) {
      Alert.alert('Agregado', `${producto.name} se agregó a tu carrito.`);
    } else if (motivo === 'agotado') {
      Alert.alert('Agotado', `${producto.name} ya no tiene unidades disponibles.`);
    } else {
      Alert.alert(
        'Ya tienes el máximo',
        `Solo hay ${producto.stock} unidades de ${producto.name} y todas están en tu carrito.`
      );
    }
  };

  // Después de crear, editar o eliminar una reseña se actualizan la lista, el
  // permiso (qué puede hacer esta persona ahora) y el producto (cambió su
  // promedio de estrellas).
  const recargarTodoDeResenas = () =>
    Promise.all([
      cargarResenas(),
      cargarPermisoResena(),
      // Recarga silenciosa: sin el spinner de pantalla completa de cargarProducto
      getProductoPorId(id).then((actualizado) => actualizado && setProducto(actualizado)).catch(() => {}),
    ]);

  const manejarNuevaResena = async ({ rating, comment }) => {
    await crearResena({ productId: id, rating, comment });
    await recargarTodoDeResenas();
  };

  const manejarEdicionResena = async ({ rating, comment }) => {
    await editarResena(permisoResena.miReview.id, { rating, comment });
    setEditandoResena(false);
    await recargarTodoDeResenas();
  };

  // Pide confirmación: borrar una reseña no se puede deshacer
  const confirmarEliminarResena = () => {
    Alert.alert('Eliminar reseña', '¿Seguro que quieres eliminar tu reseña? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarResena(permisoResena.miReview.id);
            setEditandoResena(false);
            await recargarTodoDeResenas();
          } catch (e) {
            Alert.alert('No se pudo eliminar', e.message);
          }
        },
      },
    ]);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <EstadoCargando />
      </SafeAreaView>
    );
  }

  if (error || !producto) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <EstadoError
          mensaje={error ? 'No pudimos cargar este producto.' : 'No encontramos este producto.'}
          onReintentar={error ? cargarProducto : undefined}
        />
      </SafeAreaView>
    );
  }

  const descuento = calcularDescuento(producto);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: producto.name,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: sizes.base },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
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
        </View>

        <View style={styles.contenido}>
          {producto.categoryName ? <Text style={styles.categoria}>{producto.categoryName}</Text> : null}
          <Text style={styles.nombre}>{producto.name}</Text>

          <View style={styles.precios}>
            <Text style={styles.precio}>${Number(producto.price ?? 0).toFixed(2)}</Text>
            {descuento > 0 && producto.originalPrice ? (
              <Text style={styles.precioOriginal}>${Number(producto.originalPrice).toFixed(2)}</Text>
            ) : null}
          </View>

          <View style={styles.condicionPill}>
            <Text style={styles.condicionTexto}>{producto.condition || 'Nuevo'}</Text>
          </View>

          {producto.description ? <Text style={styles.descripcion}>{producto.description}</Text> : null}

          <View style={styles.tabla}>
            <FilaSpec label="Almacenamiento" valor={producto.storage} />
            <FilaSpec label="RAM" valor={producto.ram} />
            <FilaSpec label="Color" valor={producto.color} />
            <FilaSpec
              label="Stock"
              valor={producto.stock != null ? (agotado ? 'Agotado' : String(producto.stock)) : null}
            />
          </View>

          <View style={styles.separador} />

          <Text style={styles.seccionTitulo}>Reseñas</Text>

          {cargandoResenas ? (
            <EstadoCargando full={false} style={styles.spinnerResenas} />
          ) : errorResenas ? (
            <EstadoError full={false} mensaje="No pudimos cargar las reseñas." onReintentar={cargarResenas} />
          ) : resenas.length === 0 ? (
            <Text style={styles.sinResenas}>Todavía no hay reseñas para este producto.</Text>
          ) : (
            <View style={styles.listaResenas}>
              {resenas.map((r) => (
                <View key={r.id} style={styles.resena}>
                  <View style={styles.resenaHeader}>
                    <Text style={styles.resenaNombre}>{r.userName || 'Usuario'}</Text>
                    <Estrellas cantidad={r.rating} tamano={14} />
                  </View>
                  {r.comment ? <Text style={styles.resenaComentario}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {!user ? (
            <Text style={styles.iniciaSesion}>Inicia sesión para dejar tu reseña.</Text>
          ) : !permisoResena ? null : permisoResena.miReview ? (
            editandoResena ? (
              <FormularioResena
                inicial={{ rating: permisoResena.miReview.rating, comment: permisoResena.miReview.comment }}
                onEnviar={manejarEdicionResena}
                onCancelar={() => setEditandoResena(false)}
              />
            ) : (
              <View style={styles.miResena}>
                <View style={styles.resenaHeader}>
                  <Text style={styles.resenaNombre}>Tu reseña</Text>
                  <Estrellas cantidad={permisoResena.miReview.rating} tamano={14} />
                </View>
                {permisoResena.miReview.comment ? (
                  <Text style={styles.resenaComentario}>{permisoResena.miReview.comment}</Text>
                ) : null}
                <View style={styles.miResenaAcciones}>
                  <Pressable onPress={() => setEditandoResena(true)} hitSlop={8}>
                    <Text style={styles.accionEditar}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={confirmarEliminarResena} hitSlop={8}>
                    <Text style={styles.accionEliminar}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            )
          ) : permisoResena.puedeResenar ? (
            <FormularioResena onEnviar={manejarNuevaResena} />
          ) : (
            <Text style={styles.iniciaSesion}>
              {permisoResena.motivo || 'Solo quienes compraron este producto pueden dejar una reseña.'}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={agotado ? 'Agotado' : 'Agregar al carrito'}
          onPress={agregarAlCarrito}
          disabled={agotado}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  miResena: {
    marginTop: 20,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  miResenaAcciones: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  accionEditar: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
  accionEliminar: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.danger,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 24,
  },
  imagenWrapper: {
    width: '100%',
    height: 300,
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
    fontSize: 56,
  },
  badgeDescuento: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.danger,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDescuentoTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.sm,
    color: colors.white,
  },
  contenido: {
    padding: 20,
  },
  categoria: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  nombre: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    marginTop: 4,
  },
  precios: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 10,
  },
  precio: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xxl,
    color: colors.text,
  },
  precioOriginal: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.textDim,
    textDecorationLine: 'line-through',
  },
  condicionPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 12,
  },
  condicionTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
    color: colors.primaryDark,
  },
  descripcion: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.5,
    marginTop: 16,
  },
  tabla: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filaSpec: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  filaSpecLabel: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  filaSpecValor: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 24,
  },
  seccionTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
    marginTop: 20,
  },
  spinnerResenas: {
    marginVertical: 16,
  },
  sinResenas: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textDim,
    marginTop: 8,
  },
  listaResenas: {
    marginTop: 12,
    gap: 14,
  },
  resena: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
    gap: 4,
  },
  resenaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resenaNombre: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  resenaComentario: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.4,
  },
  iniciaSesion: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textDim,
    marginTop: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
