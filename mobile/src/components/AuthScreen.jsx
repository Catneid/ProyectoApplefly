import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

// Layout compartido por login / registro / recuperar-password: fondo
// blanco, card centrada, título + subtítulo y un footer opcional (links).
export default function AuthScreen({ title, subtitle, children, footer }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {children}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xxl,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.textMuted,
    marginBottom: 24,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
});
