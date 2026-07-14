import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

/** Datos de la cuenta del cliente en sesión. */
export const usePerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    api('/profile')
      .then((datos) => activo && setPerfil(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, []);

  const actualizarPerfil = async (datos) => {
    const { customer } = await api('/profile', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
    setPerfil(customer);
    return customer;
  };

  const cambiarPassword = async (currentPassword, newPassword) => {
    await api('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  return { perfil, cargando, error, actualizarPerfil, cambiarPassword };
};
