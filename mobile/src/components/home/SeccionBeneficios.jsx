import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { fonts, sizes } from '../../theme/typography';

const BENEFICIOS = [
  {
    icono: 'shield-checkmark-outline',
    titulo: '12 meses de garantía',
    descripcion: 'Todos los dispositivos incluyen garantía total contra defectos.',
  },
  {
    icono: 'cube-outline',
    titulo: 'Envío gratis',
    descripcion: 'Envío sin costo para compras mayores a $500 a todo El Salvador.',
  },
  {
    icono: 'ribbon-outline',
    titulo: 'Certificación técnica',
    descripcion: 'Cada equipo pasa por 30+ pruebas de calidad antes de venderse.',
  },
  {
    icono: 'refresh-outline',
    titulo: '30 días de devolución',
    descripcion: 'Si no quedas satisfecho, te devolvemos tu dinero sin preguntas.',
  },
];

export default function SeccionBeneficios() {
  return (
    <View style={styles.section}>
      {BENEFICIOS.map((b) => (
        <View key={b.titulo} style={styles.item}>
          <View style={styles.icono}>
            <Ionicons name={b.icono} size={24} color={colors.primary} />
          </View>
          <View style={styles.texto}>
            <Text style={styles.titulo}>{b.titulo}</Text>
            <Text style={styles.descripcion}>{b.descripcion}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 32,
    paddingHorizontal: 20,
    gap: 20,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  descripcion: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textMuted,
    lineHeight: sizes.sm * 1.4,
  },
});
