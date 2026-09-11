import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';

import PrimaryButton from '../src/components/PrimaryButton';
import RutaProtegida from '../src/components/RutaProtegida';
import TextField from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { db } from '../src/services/firebase';
import { cobrarConWompi } from '../src/services/paymentsApi';
import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';

// Tarjeta de prueba de Wompi (cuenta en modo test: viaja de verdad a la
// API, pero no cobra dinero real). Mismos valores que usa la web en
// public/frontend/src/screens/Checkout.jsx.
const TARJETA_DEMO = { numero: '4573 6900 0199 0693', cvv: '835', mes: '12', anio: '2029' };

function Seccion({ titulo, children }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function CheckoutContenido() {
  const { user } = useAuth();
  const { items, subtotal, shipping, tax, total, vaciarCarrito } = useCart();

  const [envio, setEnvio] = useState({ nombre: '', apellido: '', direccion: '', ciudad: '', telefono: '' });
  const [tarjeta, setTarjeta] = useState({ numero: '', mes: '', anio: '', cvv: '' });
  const [errores, setErrores] = useState({});
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const perfilSnap = await getDoc(doc(db, 'users', user.uid));
        if (perfilSnap.exists()) {
          const perfil = perfilSnap.data();
          setEnvio((prev) => ({
            ...prev,
            nombre: perfil.name || '',
            apellido: perfil.lastName || '',
            direccion: perfil.address || '',
            telefono: perfil.phone || '',
          }));
        }
      } catch (e) {
        console.warn('[checkout] No se pudo precargar el perfil:', e.message);
      }
    })();
  }, [user]);

  const actualizarEnvio = (campo) => (valor) => setEnvio((prev) => ({ ...prev, [campo]: valor }));
  const actualizarTarjeta = (campo) => (valor) => setTarjeta((prev) => ({ ...prev, [campo]: valor }));

  const usarTarjetaDemo = () => setTarjeta(TARJETA_DEMO);

  const validar = () => {
    const nuevos = {};
    if (!envio.nombre.trim()) nuevos.nombre = 'Requerido';
    if (!envio.direccion.trim() || envio.direccion.trim().length < 10) {
      nuevos.direccion = 'Sé más específico, mínimo 10 caracteres';
    }
    if (!envio.ciudad.trim()) nuevos.ciudad = 'Requerido';
    if (!/^[0-9]{4}-?[0-9]{4}$/.test(envio.telefono.trim())) nuevos.telefono = 'Formato: 7777-7777';

    const numeroLimpio = tarjeta.numero.replace(/\s/g, '');
    if (numeroLimpio.length < 15) nuevos.numero = 'El número de tarjeta está incompleto';
    if (!(+tarjeta.mes >= 1 && +tarjeta.mes <= 12)) nuevos.mes = 'Mes inválido';
    if (tarjeta.anio.trim().length !== 4) nuevos.anio = 'Usa 4 dígitos';
    if (!/^[0-9]{3,4}$/.test(tarjeta.cvv.trim())) nuevos.cvv = '3 o 4 dígitos';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const confirmarCompra = async () => {
    if (items.length === 0) {
      Alert.alert('Tu carrito está vacío', 'Agregá productos antes de pagar.');
      return;
    }
    if (!validar()) return;

    setProcesando(true);
    try {
      const idToken = await user.getIdToken();

      const datos = await cobrarConWompi({
        idToken,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: +(item.price * item.quantity).toFixed(2),
        })),
        address: `${envio.direccion.trim()}, ${envio.ciudad.trim()}`,
        phone: envio.telefono.trim(),
        subtotal,
        shipping,
        tax,
        total,
        tarjeta: { ...tarjeta, titular: `${envio.nombre.trim()} ${envio.apellido.trim()}`.trim() },
        customerName: `${envio.nombre.trim()} ${envio.apellido.trim()}`.trim(),
      });

      vaciarCarrito();

      Alert.alert(
        '¡Compra confirmada!',
        `Tu pago fue aprobado (tarjeta •••• ${datos.cardLast4 || '----'}). Pedido #${datos.orderId}.`,
        [{ text: 'Listo', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      Alert.alert('No se pudo completar el pago', e.message);
    } finally {
      setProcesando(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>No hay nada que pagar</Text>
          <Text style={styles.vacioTexto}>Tu carrito está vacío.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Finalizar compra</Text>

        <Seccion titulo="¿A dónde lo enviamos?">
          <View style={styles.fila2}>
            <View style={styles.mitad}>
              <TextField label="Nombre" value={envio.nombre} onChangeText={actualizarEnvio('nombre')} error={errores.nombre} />
            </View>
            <View style={styles.mitad}>
              <TextField label="Apellido" value={envio.apellido} onChangeText={actualizarEnvio('apellido')} />
            </View>
          </View>

          <TextField
            label="Dirección"
            placeholder="Colonia, calle, número de casa"
            value={envio.direccion}
            onChangeText={actualizarEnvio('direccion')}
            error={errores.direccion}
          />

          <View style={styles.fila2}>
            <View style={styles.mitad}>
              <TextField
                label="Ciudad"
                placeholder="San Salvador"
                value={envio.ciudad}
                onChangeText={actualizarEnvio('ciudad')}
                error={errores.ciudad}
              />
            </View>
            <View style={styles.mitad}>
              <TextField
                label="Teléfono"
                placeholder="7777-7777"
                keyboardType="phone-pad"
                value={envio.telefono}
                onChangeText={actualizarEnvio('telefono')}
                error={errores.telefono}
              />
            </View>
          </View>
        </Seccion>

        <Seccion titulo="Datos de pago">
          <View style={styles.wompiAviso}>
            <Text style={styles.wompiBadge}>Pago procesado por Wompi</Text>
            <Text style={styles.wompiTexto}>
              La cuenta está en modo de prueba: la transacción viaja de verdad a Wompi, pero no se
              cobra dinero real.
            </Text>
            <PrimaryButton title="Usar tarjeta de prueba" onPress={usarTarjetaDemo} style={styles.wompiBoton} />
          </View>

          <TextField
            label="Número de tarjeta"
            placeholder="4573 6900 0199 0693"
            keyboardType="numeric"
            value={tarjeta.numero}
            onChangeText={actualizarTarjeta('numero')}
            error={errores.numero}
          />

          <View style={styles.fila3}>
            <View style={styles.tercio}>
              <TextField label="Mes" placeholder="12" keyboardType="numeric" value={tarjeta.mes} onChangeText={actualizarTarjeta('mes')} error={errores.mes} />
            </View>
            <View style={styles.tercio}>
              <TextField label="Año" placeholder="2029" keyboardType="numeric" value={tarjeta.anio} onChangeText={actualizarTarjeta('anio')} error={errores.anio} />
            </View>
            <View style={styles.tercio}>
              <TextField label="CVV" placeholder="835" keyboardType="numeric" secureTextEntry value={tarjeta.cvv} onChangeText={actualizarTarjeta('cvv')} error={errores.cvv} />
            </View>
          </View>
        </Seccion>

        <Seccion titulo={`Productos (${items.length})`}>
          {items.map((item) => (
            <View key={item.productId} style={styles.itemFila}>
              <Text style={styles.itemNombre} numberOfLines={1}>
                {item.name} <Text style={styles.itemCantidad}>x{item.quantity}</Text>
              </Text>
              <Text style={styles.itemPrecio}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </Seccion>

        <View style={styles.resumen}>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>Subtotal</Text>
            <Text style={styles.resumenValor}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>Envío</Text>
            <Text style={styles.resumenValor}>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</Text>
          </View>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>IVA (13%)</Text>
            <Text style={styles.resumenValor}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.resumenFila, styles.resumenTotalFila]}>
            <Text style={styles.resumenTotalLabel}>Total</Text>
            <Text style={styles.resumenTotalValor}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={procesando ? 'Procesando pago...' : `Pagar $${total.toFixed(2)}`}
          onPress={confirmarCompra}
          loading={procesando}
        />
      </View>
    </SafeAreaView>
  );
}

export default function Checkout() {
  return (
    <RutaProtegida>
      <CheckoutContenido />
    </RutaProtegida>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 40,
  },
  vacioTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  vacioTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  scroll: {
    padding: 20,
    paddingBottom: 12,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    marginBottom: 16,
  },
  seccion: {
    marginBottom: 24,
  },
  seccionTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  fila2: {
    flexDirection: 'row',
    gap: 12,
  },
  mitad: {
    flex: 1,
  },
  fila3: {
    flexDirection: 'row',
    gap: 12,
  },
  tercio: {
    flex: 1,
  },
  wompiAviso: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  wompiBadge: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.xs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  wompiTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.4,
  },
  wompiBoton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
  },
  itemFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
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
  resumen: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumenLabel: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  resumenValor: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.text,
  },
  resumenTotalFila: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  resumenTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: sizes.base,
    color: colors.text,
  },
  resumenTotalValor: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.lg,
    color: colors.text,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
