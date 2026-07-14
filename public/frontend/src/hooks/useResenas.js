import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const SIN_PERMISO = { comprado: false, puedeResenar: false, miResena: null };

/**
 * Reseñas de un producto.
 *
 * `permiso` responde tres cosas que la pantalla necesita para decidir qué
 * mostrar: si el cliente compró el producto, si todavía puede reseñarlo, y
 * cuál es la reseña que ya dejó (para poder editarla).
 * Solo se consulta si hay sesión: a un visitante anónimo no tiene sentido
 * preguntarle al backend, y daría 401.
 */
export const useResenas = (productoId, haySesion) => {
  const [resenas, setResenas] = useState([]);
  const [permiso, setPermiso] = useState(SIN_PERMISO);
  const [cargando, setCargando] = useState(true);

  const traerDatos = useCallback(async () => {
    const lista = await api(`/reviews/producto/${productoId}`);

    if (!haySesion) {
      return { lista, permiso: SIN_PERMISO };
    }

    const p = await api(`/reviews/puedo-resenar/${productoId}`);
    return {
      lista,
      permiso: {
        comprado: p.comprado,
        puedeResenar: p['puedeReseñar'],
        miResena: p.miReview,
      },
    };
  }, [productoId, haySesion]);

  // Sin setState síncrono antes del primer await: eso provocaría renders
  // en cascada. `activo` evita escribir estado tras desmontar el componente.
  useEffect(() => {
    if (!productoId) return;

    let activo = true;

    traerDatos()
      .then(({ lista, permiso }) => {
        if (!activo) return;
        setResenas(lista);
        setPermiso(permiso);
      })
      .catch(() => {
        // Que fallen las reseñas no debe tumbar la ficha del producto
        if (activo) setResenas([]);
      })
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [productoId, traerDatos]);

  // Se llama desde los manejadores de eventos, no desde un efecto
  const recargar = useCallback(async () => {
    const { lista, permiso } = await traerDatos();
    setResenas(lista);
    setPermiso(permiso);
  }, [traerDatos]);

  const crearResena = async (rating, comment) => {
    await api('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId: productoId, rating, comment }),
    });
    await recargar();
  };

  const editarResena = async (resenaId, rating, comment) => {
    await api(`/reviews/${resenaId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    });
    await recargar();
  };

  const eliminarResena = async (resenaId) => {
    await api(`/reviews/${resenaId}`, { method: 'DELETE' });
    await recargar();
  };

  return { resenas, permiso, cargando, crearResena, editarResena, eliminarResena };
};
