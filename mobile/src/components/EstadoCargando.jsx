import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

// Spinner centrado, consistente en toda la app para las pantallas que leen
// de Firestore (Inicio, Catálogo, Detalle de producto, Pedidos, Perfil).
// `full` (default true) hace que ocupe toda la pantalla; pasá full={false}
// para un spinner más chico embebido dentro de otra pantalla ya cargada.
export default function EstadoCargando({ full = true, style }) {
  return (
    <View style={[full && styles.pantallaCompleta, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  pantallaCompleta: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
