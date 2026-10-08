import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

// Barra de pestañas propia, en lugar de la que trae expo-router.
//
// La de expo-router dibuja cada ícono DOS veces (activo e inactivo, uno
// encima del otro) y alterna su opacidad entre 1 y 0 para hacer un fundido.
// En React Native 0.86 con la nueva arquitectura (Fabric), al pasar una de
// esas vistas de opacidad 1 a 0, Fabric tiene que mover el ícono dentro de
// ella, y a veces lo hace en el orden equivocado: Android cierra la app con
// "The specified child already has a parent". Pasaba al cambiar de pestaña
// (sobre todo a Pedidos y Perfil, recién abierta la app).
//
// Acá cada pestaña tiene UN solo ícono: al enfocarse solo cambian el nombre
// del ícono y el color, sin vistas que aparezcan, desaparezcan ni se muevan.
//
// Cada pantalla declara su ícono en el _layout con `tabBarIconName`:
// { inactivo: 'home-outline', activo: 'home' }.
export default function BarraPestanas({ state, descriptors, navigation, insets }) {
  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, indice) => {
        const { options } = descriptors[route.key];
        const enfocada = state.index === indice;
        const color = enfocada ? colors.primary : colors.textDim;
        const titulo = options.title ?? route.name;
        const iconos = options.tabBarIconName;
        const badge = options.tabBarBadge;

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!enfocada && !evento.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const alMantener = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={alPresionar}
            onLongPress={alMantener}
            accessibilityRole="tab"
            accessibilityState={enfocada ? { selected: true } : {}}
            accessibilityLabel={badge ? `${titulo}, ${badge}` : titulo}
            style={styles.pestana}
          >
            <View style={styles.iconoCaja}>
              <Ionicons
                name={enfocada ? iconos?.activo : iconos?.inactivo}
                size={24}
                color={color}
              />
              {badge != null ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto} numberOfLines={1}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.etiqueta, { color }]} numberOfLines={1}>
              {titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconoCaja: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  etiqueta: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
  },
});
