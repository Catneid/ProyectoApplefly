import { Tabs } from 'expo-router';

import BarraPestanas from '../../src/components/BarraPestanas';
import { useCart } from '../../src/context/CartContext';

export default function TabsLayout() {
  const { cantidadTotal } = useCart();

  return (
    <Tabs
      // Barra propia: la de expo-router hacía cerrar la app en Android al
      // cambiar de pestaña (ver src/components/BarraPestanas.jsx).
      tabBar={(props) => <BarraPestanas {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIconName: { inactivo: 'home-outline', activo: 'home' },
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIconName: { inactivo: 'grid-outline', activo: 'grid' },
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          // undefined (no 0) para que el badge no se muestre cuando está vacío.
          tabBarBadge: cantidadTotal > 0 ? cantidadTotal : undefined,
          tabBarIconName: { inactivo: 'cart-outline', activo: 'cart' },
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          // La pantalla misma redirige a /login si no hay sesión (ver
          // src/components/RutaProtegida.jsx) — no interceptamos el tap acá.
          tabBarIconName: { inactivo: 'receipt-outline', activo: 'receipt' },
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIconName: { inactivo: 'person-outline', activo: 'person' },
        }}
      />
    </Tabs>
  );
}
