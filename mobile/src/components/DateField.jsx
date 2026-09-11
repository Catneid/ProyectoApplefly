import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

const formatearFecha = (fecha) => {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
};

// Selector de fecha para birthdate. En Android el picker nativo ya es un
// diálogo modal que se cierra solo; en iOS es un spinner inline, así que
// necesita un botón "Listo" para cerrarlo.
export default function DateField({ label, value, onChange, error }) {
  const [mostrar, setMostrar] = useState(false);

  // API nueva de v9: onValueChange solo dispara cuando de verdad se eligió
  // una fecha (siempre viene con date), y onDismiss cuando se cierra sin
  // elegir nada — ya no hace falta chequear event.type a mano.
  const cerrarSiEsAndroid = () => {
    if (Platform.OS === 'android') setMostrar(false);
  };

  const manejarSeleccion = (_event, fechaSeleccionada) => {
    cerrarSiEsAndroid();
    onChange(fechaSeleccionada);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[styles.input, error && styles.inputError]}
        onPress={() => setMostrar(true)}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatearFecha(value) : 'DD/MM/AAAA'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

      {mostrar && (
        <DateTimePicker
          value={value || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onValueChange={manejarSeleccion}
          onDismiss={cerrarSiEsAndroid}
        />
      )}

      {mostrar && Platform.OS === 'ios' && (
        <Pressable style={styles.listo} onPress={() => setMostrar(false)}>
          <Text style={styles.listoTexto}>Listo</Text>
        </Pressable>
      )}
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
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  value: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.text,
  },
  placeholder: {
    fontFamily: fonts.regular,
    fontSize: sizes.base,
    color: colors.textDim,
  },
  errorMsg: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.danger,
    marginTop: 4,
  },
  listo: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  listoTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
});
