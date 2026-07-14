import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

/**
 * Historial de pedidos del cliente que tiene la sesión abierta.
 * El backend solo devuelve los suyos, nunca los de otra persona.
 */
export const usePedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // La carga inicial va dentro del efecto y sin tocar el estado antes del
  // primer await: hacerlo de forma síncrona dispararía renders en cascada.
  // `activo` evita escribir estado si el componente ya se desmontó.
  useEffect(() => {
    let activo = true;

    api('/orders/mis-pedidos')
      .then((datos) => activo && setPedidos(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, []);

  // Para recargar a mano después de una acción del usuario
  const recargarPedidos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setPedidos(await api('/orders/mis-pedidos'));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const crearPedido = async (datosPedido) => {
    const { order } = await api('/orders', {
      method: 'POST',
      body: JSON.stringify(datosPedido),
    });
    return order;
  };

  return { pedidos, cargando, error, recargarPedidos, crearPedido };
};
