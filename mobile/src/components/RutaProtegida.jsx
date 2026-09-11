import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

/**
 * Envuelve las pantallas que exigen sesión iniciada (checkout, mis pedidos,
 * perfil — fases siguientes). Si no hay usuario, manda al login.
 *
 * Esto es solo la mitad visual de la protección: los datos reales siguen
 * protegidos por las reglas de seguridad de Firestore/Storage, que son las
 * que de verdad importan si alguien intenta pegarle directo a la API.
 */
export default function RutaProtegida({ children }) {
  const { user, cargando } = useAuth();

  // Todavía estamos preguntándole a Firebase si la sesión sigue viva.
  // Redirigir ahora echaría al login a un usuario que sí está dentro.
  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return children;
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
