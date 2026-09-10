import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../src/theme/colors';
import { fonts, sizes } from '../src/theme/typography';

export default function Home() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Applefly</Text>
      <Text style={styles.subtitle}>Expo Router está andando 🎉</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.textMuted,
  },
});
