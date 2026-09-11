import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Estrellas from './Estrellas';
import PrimaryButton from './PrimaryButton';
import TextField from './TextField';
import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';

// onEnviar recibe { rating, comment } y hace el crearResena real — así este
// componente no sabe nada de Firestore, solo de la UI del formulario.
export default function FormularioResena({ onEnviar }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const manejarEnvio = async () => {
    setError('');
    if (rating === 0) {
      setError('Elegí un puntaje de 1 a 5 estrellas.');
      return;
    }

    setEnviando(true);
    try {
      await onEnviar({ rating, comment: comment.trim() });
      setRating(0);
      setComment('');
    } catch {
      setError('No pudimos guardar tu reseña. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Dejá tu reseña</Text>
      <Estrellas cantidad={rating} tamano={28} onCambiar={setRating} />

      <TextField
        placeholder="Contanos tu experiencia (opcional)"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        style={styles.textarea}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title={enviando ? 'Enviando...' : 'Publicar reseña'}
        onPress={manejarEnvio}
        loading={enviando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    gap: 10,
  },
  titulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.danger,
  },
});
