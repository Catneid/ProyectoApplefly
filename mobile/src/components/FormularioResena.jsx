import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Estrellas from './Estrellas';
import PrimaryButton from './PrimaryButton';
import TextField from './TextField';
import { colors } from '../theme/colors';
import { fonts, sizes } from '../theme/typography';
import { COMENTARIO, errorCalificacion, errorComentario } from '../utils/validaciones';

// onEnviar recibe { rating, comment } y hace la llamada real (crear o editar):
// así este componente no sabe nada de la API, solo de la UI del formulario.
//
// Sirve para crear y para editar:
//   - `inicial` ({ rating, comment }): al editar, con los valores actuales
//   - `onCancelar`: si viene, se muestra el botón "Cancelar" (modo edición)
// Las estrellas y el comentario (3 a 500 caracteres) son obligatorios; las
// mismas reglas las exige el servidor.
export default function FormularioResena({ onEnviar, inicial, onCancelar }) {
  const editando = Boolean(inicial);

  const [rating, setRating] = useState(inicial?.rating ?? 0);
  const [comment, setComment] = useState(inicial?.comment ?? '');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cambiarRating = (valor) => {
    setRating(valor);
    setErrores((prev) => ({ ...prev, rating: undefined }));
  };

  const cambiarComentario = (texto) => {
    setComment(texto);
    setErrores((prev) => ({ ...prev, comment: undefined }));
  };

  const manejarEnvio = async () => {
    setError('');

    const nuevos = {};
    const errorRating = errorCalificacion(rating);
    const errorTexto = errorComentario(comment);
    if (errorRating) nuevos.rating = errorRating;
    if (errorTexto) nuevos.comment = errorTexto;
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await onEnviar({ rating, comment: comment.trim() });
      if (!editando) {
        setRating(0);
        setComment('');
      }
    } catch (e) {
      // El backend explica el motivo (p. ej. "Ya dejaste una reseña")
      setError(e?.message || 'No pudimos guardar tu reseña. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{editando ? 'Edita tu reseña' : 'Deja tu reseña'}</Text>

      <Estrellas cantidad={rating} tamano={28} onCambiar={cambiarRating} />
      {errores.rating ? <Text style={styles.error}>{errores.rating}</Text> : null}

      <View style={styles.comentarioCabecera}>
        <Text style={styles.comentarioEtiqueta}>Comentario</Text>
        <Text style={styles.contador}>
          {comment.length}/{COMENTARIO.max}
        </Text>
      </View>
      <TextField
        placeholder="Cuéntanos tu experiencia (3 a 500 caracteres)"
        value={comment}
        onChangeText={cambiarComentario}
        multiline
        numberOfLines={3}
        maxLength={COMENTARIO.max}
        style={styles.textarea}
        error={errores.comment}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title={enviando ? 'Enviando...' : editando ? 'Guardar cambios' : 'Publicar reseña'}
        onPress={manejarEnvio}
        loading={enviando}
      />

      {onCancelar ? (
        <Text style={styles.cancelar} onPress={enviando ? undefined : onCancelar}>
          Cancelar
        </Text>
      ) : null}
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
  comentarioCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: -4,
  },
  comentarioEtiqueta: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.text,
  },
  contador: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.danger,
  },
  cancelar: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
