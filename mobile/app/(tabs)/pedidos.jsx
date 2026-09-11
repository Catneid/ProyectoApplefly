import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoCargando from '../../src/components/EstadoCargando';
import EstadoError from '../../src/components/EstadoError';
import PrimaryButton from '../../src/components/PrimaryButton';
import RutaProtegida from '../../src/components/RutaProtegida';
import { useAuth } from '../../src/context/AuthContext';
import { escucharMisOrdenes } from '../../src/services/orders';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

// Mismos 5 estados que firestoreSchema.js. Los colores están pensados para
// leerse de un vistazo: gris = todavía no se movió, azul = en curso, verde
// = terminó bien, rojo = terminó mal.
const ESTADOS = {
  pendiente: { label: 'Pendiente', bg: colors.surfaceAlt, text: colors.textMuted },
  procesando: { label: 'Procesando', bg: colors.primarySoft, text: colors.primaryDark },
  enviado: { label: 'Enviado', bg: colors.primaryDark, text: colors.white },
  entregado: { label: 'Entregado', bg: colors.success, text: colors.white },
  cancelado: { label: 'Cancelado', bg: colors.danger, text: colors.white },
};

function EstadoChip({ status }) {
  const estilo = ESTADOS[status] || ESTADOS.pendiente;
  return (
    <View style={[styles.chip, { backgroundColor: estilo.bg }]}>
      <Text style={[styles.chipTexto, { color: estilo.text }]}>{estilo.label}</Text>
    </View>
  );
}

function formatearFecha(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
}

function FilaDato({ label, valor }) {
  if (!valor) return null;
  return (
    <View style={styles.filaDato}>
      <Text style={styles.filaDatoLabel}>{label}</Text>
      <Text style={styles.filaDatoValor}>{valor}</Text>
    </View>
  );
}

function DetallePedido({ pedido, onCerrar }) {
  return (
    <Modal visible={!!pedido} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.overlay} onPress={onCerrar} />

      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitulo}>Pedido</Text>
            <Text style={styles.sheetSubtitulo}>{formatearFecha(pedido?.createdAt)}</Text>
          </View>
          <Pressable onPress={onCerrar} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.sheetContenido}>
          <EstadoChip status={pedido?.status} />

          <View style={styles.grupo}>
            <Text style={styles.grupoTitulo}>Productos</Text>
            {(pedido?.products || []).map((item, indice) => (
              <View key={item.productId || indice} style={styles.itemFila}>
                <Text style={styles.itemNombre} numberOfLines={1}>
                  {item.name} <Text style={styles.itemCantidad}>x{item.quantity}</Text>
                </Text>
                <Text style={styles.itemPrecio}>${Number(item.subtotal ?? 0).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalFila}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValor}>${Number(pedido?.total ?? 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.grupo}>
            <Text style={styles.grupoTitulo}>Envío</Text>
            <FilaDato label="Dirección" valor={pedido?.address} />
            <FilaDato label="Teléfono" valor={pedido?.phone} />
          </View>

          <View style={styles.grupo}>
            <Text style={styles.grupoTitulo}>Pago</Text>
            <FilaDato label="Método" valor={pedido?.payment?.method === 'wompi' ? 'Tarjeta (Wompi)' : pedido?.payment?.method} />
            {pedido?.payment?.cardLast4 ? (
              <FilaDato label="Tarjeta" valor={`•••• ${pedido.payment.cardLast4}`} />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PedidosContenido() {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  // Cambiar esto vuelve a montar el efecto de abajo, lo que arma de nuevo
  // el listener de Firestore — es el "Reintentar" del estado de error.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!user) return;
    setCargando(true);
    setError(false);

    // onSnapshot en vez de una carga única: si el backend actualiza el
    // status de un pedido (por ejemplo, de "procesando" a "enviado"), la
    // lista se refresca sola, sin que el cliente tenga que hacer nada.
    const unsubscribe = escucharMisOrdenes(
      user.uid,
      (lista) => {
        setOrdenes(lista);
        setCargando(false);
      },
      () => {
        setError(true);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, [user, intento]);

  if (cargando) {
    return <EstadoCargando />;
  }

  if (error) {
    return (
      <EstadoError
        mensaje="No pudimos cargar tus pedidos."
        onReintentar={() => setIntento((n) => n + 1)}
      />
    );
  }

  if (ordenes.length === 0) {
    return (
      <View style={styles.vacio}>
        <Ionicons name="receipt-outline" size={48} color={colors.textDim} />
        <Text style={styles.vacioTitulo}>Todavía no tenés pedidos</Text>
        <Text style={styles.vacioTexto}>Acá vas a poder ver el estado de tus compras.</Text>
        <PrimaryButton
          title="Ir al catálogo"
          onPress={() => router.push('/(tabs)/catalogo')}
          style={styles.vacioBoton}
        />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={ordenes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSeleccionado(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardFecha}>{formatearFecha(item.createdAt)}</Text>
              <EstadoChip status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardProductos}>
                {item.products?.length || 0} {item.products?.length === 1 ? 'producto' : 'productos'}
              </Text>
              <Text style={styles.cardTotal}>${Number(item.total ?? 0).toFixed(2)}</Text>
            </View>
          </Pressable>
        )}
      />

      <DetallePedido pedido={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </>
  );
}

// RutaProtegida se encarga de mandar a /login si no hay sesión, en vez de
// mostrar esta pantalla — así se ve al tocar la pestaña "Pedidos".
export default function Pedidos() {
  return (
    <RutaProtegida>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.titulo}>Mis pedidos</Text>
        <PedidosContenido />
      </SafeAreaView>
    </RutaProtegida>
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
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  vacioBoton: {
    marginTop: 12,
    paddingHorizontal: 32,
  },
  lista: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFecha: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  cardProductos: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  cardTotal: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
  },
  sheetSubtitulo: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetContenido: {
    padding: 20,
    gap: 24,
  },
  grupo: {
    gap: 10,
  },
  grupoTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  itemFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  itemNombre: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.text,
  },
  itemCantidad: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  itemPrecio: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  totalValor: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaDatoLabel: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  filaDatoValor: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
});
