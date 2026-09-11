import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

export default function TextField({ label, error, style, ...props }) {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textDim}
        {...props}
      />
      {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorMsg: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.danger,
    marginTop: 4,
  },
});
