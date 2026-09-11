import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

export default function PrimaryButton({ title, onPress, loading, disabled, style }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryHover,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDark,
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    // Bold en vez de semiBold: sobre este azul (#067FF9) el blanco da
    // ~3.9:1 de contraste (por debajo del 4.5:1 de AA para texto normal,
    // aunque sí cumple el 3:1 de componentes de UI) — el trazo más grueso
    // ayuda a la legibilidad real sin cambiar el azul de marca.
    fontFamily: fonts.bold,
    fontSize: sizes.base,
  },
});
