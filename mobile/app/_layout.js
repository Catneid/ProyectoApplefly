import { useCallback, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { colors } from '../src/theme/colors';
import { interFonts } from '../src/theme/typography';
// Import de efecto: inicializa Firebase (app + auth + firestore) al arrancar.
import '../src/services/firebase';

// Keep the native splash screen visible while the Inter fonts load.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(interFonts);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const listo = fontsLoaded || fontError;

  // Al tocar la notificación de "pago confirmado" (Fase 8), mandar directo
  // a Pedidos — sea que la app estuviera abierta en segundo plano o que la
  // haya abierto el propio toque de la notificación.
  useEffect(() => {
    if (!listo) return;

    const irAPedidos = () => router.push('/(tabs)/pedidos');

    const suscripcion = Notifications.addNotificationResponseReceivedListener(irAPedidos);

    // Por si la app arrancó en frío justo por ese toque: en algunas
    // versiones el listener de arriba no llega a dispararse para esa
    // primera respuesta.
    Notifications.getLastNotificationResponseAsync().then((respuesta) => {
      if (respuesta) irAPedidos();
    });

    return () => suscripcion.remove();
  }, [listo]);

  if (!listo) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <StatusBar style="dark" backgroundColor={colors.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </SafeAreaProvider>
      </CartProvider>
    </AuthProvider>
  );
}
