import { useState } from 'react';
import { api } from '../services/api.js';

/**
 * Encapsula los tres pasos que exige Wompi para cobrar una tarjeta:
 *
 *   1. Pedir un token de acceso a la API (dura 1 hora).
 *   2. Cambiar el número de tarjeta por un token de un solo uso
 *      ("tokenización"). Wompi nunca cobra sobre el número real.
 *   3. Cobrar ese token.
 *
 * Las credenciales de Wompi viven en el backend, así que estos tres pasos
 * pasan por nuestro servidor y nunca se exponen en el navegador.
 */
export const useWompi = () => {
  const [procesando, setProcesando] = useState(false);

  const pagar = async ({ monto, nombreCliente, emailCliente, tarjeta }) => {
    setProcesando(true);

    try {
      // Paso 1
      const { access_token } = await api('/wompi/token', { method: 'POST' });

      // Paso 2
      const tokenizada = await api('/wompi/tokenizar', {
        method: 'POST',
        body: JSON.stringify({
          token: access_token,
          numeroTarjeta: tarjeta.numero.replace(/\s/g, ''),
          cvv: tarjeta.cvv,
          mesVencimiento: tarjeta.mes,
          anioVencimiento: tarjeta.anio,
          nombreTarjetaHabiente: tarjeta.titular,
        }),
      });

      // Paso 3
      const transaccion = await api('/wompi/paymentTest', {
        method: 'POST',
        body: JSON.stringify({
          token: access_token,
          formData: {
            monto,
            nombreCliente,
            emailCliente,
            tokenTarjeta: tokenizada.token,
          },
        }),
      });

      if (!transaccion.esAprobada) {
        throw new Error(transaccion.mensaje || 'La tarjeta fue rechazada');
      }

      return {
        idTransaccion: transaccion.idTransaccion,
        codigoAutorizacion: transaccion.codigoAutorizacion,
        mensaje: transaccion.mensaje,
        // "4573 6900 XXXX 0693" -> nos quedamos con los últimos 4 dígitos
        cardLast4: tokenizada.tarjetaEnmascarada?.trim().slice(-4),
      };
    } finally {
      setProcesando(false);
    }
  };

  return { pagar, procesando };
};
