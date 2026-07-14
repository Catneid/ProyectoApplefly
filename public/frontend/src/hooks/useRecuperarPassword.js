import { useState } from 'react';
import { api } from '../services/api.js';

/**
 * Los tres pasos de la recuperación de contraseña. El backend recuerda en
 * qué paso va el usuario mediante una cookie firmada (recoveryCookie) que
 * expira a los 15 minutos, así que aquí solo llevamos el paso visual.
 */
export const useRecuperarPassword = () => {
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const solicitarCodigo = async (correo) => {
    setEnviando(true);
    try {
      const r = await api('/recoveryPassword/requestCode', {
        method: 'POST',
        body: JSON.stringify({ email: correo }),
      });
      setEmail(correo);
      setPaso(2);
      return r.message;
    } finally {
      setEnviando(false);
    }
  };

  const verificarCodigo = async (codigo) => {
    setEnviando(true);
    try {
      const r = await api('/recoveryPassword/verifyCode', {
        method: 'POST',
        body: JSON.stringify({ codeRequest: codigo }),
      });
      setPaso(3);
      return r.message;
    } finally {
      setEnviando(false);
    }
  };

  const guardarNuevaPassword = async (newPassword, confirmNewPassword) => {
    setEnviando(true);
    try {
      const r = await api('/recoveryPassword/newPassword', {
        method: 'POST',
        body: JSON.stringify({ newPassword, confirmNewPassword }),
      });
      return r.message;
    } finally {
      setEnviando(false);
    }
  };

  return { paso, email, enviando, solicitarCodigo, verificarCodigo, guardarNuevaPassword };
};
