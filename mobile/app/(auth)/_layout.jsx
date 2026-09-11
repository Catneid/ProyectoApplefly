import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

// Si ya hay sesión iniciada, no tiene sentido mostrar login/registro:
// mandamos directo al home.
export default function AuthLayout() {
  const { user, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
