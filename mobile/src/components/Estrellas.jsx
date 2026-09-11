import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

const VALORES = [1, 2, 3, 4, 5];

// Modo lectura (solo muestra "cantidad") o interactivo (pasale onCambiar y
// se vuelve un selector de puntaje tocable). Se usa en Testimonios, en la
// lista de reseñas y en el formulario para dejar una reseña nueva.
export default function Estrellas({ cantidad = 0, tamano = 16, onCambiar }) {
  const interactivo = typeof onCambiar === 'function';

  return (
    <View style={styles.fila}>
      {VALORES.map((valor) =>
        interactivo ? (
          <Pressable key={valor} onPress={() => onCambiar(valor)} hitSlop={6}>
            <Ionicons
              name={valor <= cantidad ? 'star' : 'star-outline'}
              size={tamano}
              color={colors.warning}
            />
          </Pressable>
        ) : (
          <Ionicons
            key={valor}
            name={valor <= cantidad ? 'star' : 'star-outline'}
            size={tamano}
            color={colors.warning}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 2,
  },
});
