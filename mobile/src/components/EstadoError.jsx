import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

// Mismo look en toda la app cuando falla una lectura de Firestore: ícono +
// mensaje + botón opcional para reintentar. `full` (default true) ocupa
// toda la pantalla; pasá full={false} para un aviso más chico embebido
// dentro de una pantalla que ya tiene otro contenido (por ejemplo, Inicio,
// que sigue mostrando el hero aunque el catálogo no haya cargado).
export default function EstadoError({ mensaje, onReintentar, full = true, style }) {
  return (
    <View style={[styles.contenedor, full && styles.pantallaCompleta, style]}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
      <Text style={styles.mensaje}>
        {mensaje || 'No pudimos cargar la información. Revisá tu conexión.'}
      </Text>
      {onReintentar ? (
        <Pressable style={styles.boton} onPress={onReintentar}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  pantallaCompleta: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mensaje: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  boton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  botonTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
});
