import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../src/components/PrimaryButton';
import RutaProtegida from '../src/components/RutaProtegida';
import TextField from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { mapearPerfil } from '../src/services/adaptadores';
import { apiFetch } from '../src/services/api';
import { revisarCarritoContraCatalogo } from '../src/services/carritoCatalogo';
import { cobrarConWompi } from '../src/services/paymentsApi';
import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';
import {
  formatearNumeroTarjeta, soloDigitos, validarTarjeta,
} from '../src/utils/validaciones';

// Tarjeta de prueba de Wompi (cuenta en modo test: viaja de verdad a la
// API, pero no cobra dinero real). Mismos valores que usa la web en
// public/frontend/src/screens/Checkout.jsx.
const TARJETA_DEMO = { numero: '4573 6900 0199 0693', cvv: '835', mes: '12', anio: '2029' };
const TITULAR_DEMO = 'Cliente Prueba';

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
  const { items, subtotal, shipping, tax, total, vaciarCarrito, reemplazarItems } = useCart();

  const [envio, setEnvio] = useState({ nombre: '', apellido: '', direccion: '', ciudad: '', telefono: '' });
  const [tarjeta, setTarjeta] = useState({ numero: '', mes: '', anio: '', cvv: '', titular: '' });
  const [errores, setErrores] = useState({});
  const [procesando, setProcesando] = useState(false);

  // Datos de envío precargados desde el perfil de la API (la misma fuente que
  // la pantalla Perfil). Si no se puede, el formulario queda vacío y se llena a mano.
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const perfil = mapearPerfil(await apiFetch('/profile', { auth: true }));
        setEnvio((prev) => ({
          ...prev,
          nombre: perfil.name,
          apellido: perfil.lastName,
          direccion: perfil.address,
          telefono: perfil.phone,
        }));
      } catch (e) {
        console.warn('[checkout] No se pudo precargar el perfil:', e.message);
      }
    })();
  }, [user]);

  const actualizarEnvio = (campo) => (valor) => setEnvio((prev) => ({ ...prev, [campo]: valor }));
  // Los campos numéricos de la tarjeta solo aceptan dígitos (y el número se
  // muestra con un espacio cada 4); `limite` es el máximo de dígitos.
  const actualizarTarjeta = (campo) => (valor) => {
    let limpio = valor;
    if (campo === 'numero') limpio = formatearNumeroTarjeta(valor);
    else if (campo === 'mes') limpio = soloDigitos(valor).slice(0, 2);
    else if (campo === 'anio') limpio = soloDigitos(valor).slice(0, 4);
    else if (campo === 'cvv') limpio = soloDigitos(valor).slice(0, 4);

    setTarjeta((prev) => ({ ...prev, [campo]: limpio }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const usarTarjetaDemo = () =>
    setTarjeta({
      ...TARJETA_DEMO,
      titular: `${envio.nombre} ${envio.apellido}`.trim().replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, '') || TITULAR_DEMO,
    });

  const validar = () => {
    const nuevos = {};
    if (!envio.nombre.trim()) nuevos.nombre = 'Requerido';
    if (!envio.direccion.trim() || envio.direccion.trim().length < 10) {
      nuevos.direccion = 'Sé más específico, mínimo 10 caracteres';
    }
    if (!envio.ciudad.trim()) nuevos.ciudad = 'Requerido';
    if (!/^[0-9]{4}-?[0-9]{4}$/.test(envio.telefono.trim())) nuevos.telefono = 'Formato: 7777-7777';

    // Mismas reglas que el servidor (leerTarjeta en public/backend)
    Object.assign(nuevos, validarTarjeta(tarjeta));

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

    // Antes de cobrar se confirma con el servidor que los precios y el stock
    // del carrito siguen siendo los mismos. Si algo cambió, se actualiza el
    // carrito, se le avisa a la persona y NO se cobra: tiene que ver el
    // total nuevo y volver a tocar "Pagar" para confirmarlo.
    try {
      const revision = await revisarCarritoContraCatalogo(items);
      reemplazarItems(revision.items);

      if (revision.cambios.length > 0) {
        setProcesando(false);
        Alert.alert(
          'Tu carrito cambió',
          revision.cambios.join('\n\n') +
            '\n\nRevisa el total y toca "Pagar" de nuevo si estás de acuerdo. No se hizo ningún cobro.'
        );
        return;
      }
    } catch (e) {
      setProcesando(false);
      Alert.alert(
        'No pudimos confirmar tu pedido',
        'No se pudo verificar los precios y el stock actuales. No se hizo ningún cobro; inténtalo de nuevo.'
      );
      return;
    }

    try {
      const datos = await cobrarConWompi({
        // Solo qué se compra: los precios y el total los calcula el backend
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        address: `${envio.direccion.trim()}, ${envio.ciudad.trim()}`,
        phone: envio.telefono.trim(),
        tarjeta: {
          // Sin los espacios con que se muestra el número, y el mes con dos dígitos
          numero: soloDigitos(tarjeta.numero),
          mes: tarjeta.mes.padStart(2, '0'),
          anio: tarjeta.anio,
          cvv: tarjeta.cvv,
          titular: tarjeta.titular.trim(),
        },
        customerName: `${envio.nombre.trim()} ${envio.apellido.trim()}`.trim(),
      });

      vaciarCarrito();

      // El total cobrado es el que calculó el backend, no el del carrito
      Alert.alert(
        '¡Compra confirmada!',
        `Tu pago de $${datos.total.toFixed(2)} fue aprobado (tarjeta •••• ${datos.cardLast4 || '----'}). Pedido #${datos.orderId}.`,
        [{ text: 'Listo', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      // No se sabe si el cobro pasó: el servidor guardó el pedido para revisarlo.
      // Se vacía el carrito para que no se pague dos veces.
      if (e.datos?.code === 'PAGO_EN_REVISION') {
        vaciarCarrito();
        Alert.alert('Estamos revisando tu pago', e.message, [
          { text: 'Ver mis pedidos', onPress: () => router.replace('/(tabs)/pedidos') },
        ]);
        return;
      }
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
            maxLength={23}
            error={errores.numero}
          />

          <TextField
            label="Titular de la tarjeta"
            placeholder="Como aparece en la tarjeta"
            autoCapitalize="characters"
            autoCorrect={false}
            value={tarjeta.titular}
            onChangeText={actualizarTarjeta('titular')}
            maxLength={100}
            error={errores.titular}
          />

          <View style={styles.fila3}>
            <View style={styles.tercio}>
              <TextField label="Mes" placeholder="12" keyboardType="numeric" maxLength={2} value={tarjeta.mes} onChangeText={actualizarTarjeta('mes')} error={errores.mes} />
            </View>
            <View style={styles.tercio}>
              <TextField label="Año" placeholder="2029" keyboardType="numeric" maxLength={4} value={tarjeta.anio} onChangeText={actualizarTarjeta('anio')} error={errores.anio} />
            </View>
            <View style={styles.tercio}>
              <TextField label="CVV" placeholder="835" keyboardType="numeric" maxLength={4} secureTextEntry value={tarjeta.cvv} onChangeText={actualizarTarjeta('cvv')} error={errores.cvv} />
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
            <Text style={styles.resumenTotalLabel}>Total estimado</Text>
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
