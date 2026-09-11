import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '../../src/context/CartContext';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

export default function TabsLayout() {
  const { cantidadTotal } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: sizes.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          // undefined (no 0) para que el badge no se muestre cuando está vacío.
          tabBarBadge: cantidadTotal > 0 ? cantidadTotal : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          // La pantalla misma redirige a /login si no hay sesión (ver
          // src/components/RutaProtegida.jsx) — no interceptamos el tap acá.
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
