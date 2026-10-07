import { useState } from 'react';
import { api } from '../services/api.js';

/**
 * Paga y crea el pedido en una sola llamada a POST /orders/checkout.
 *
 * El navegador solo manda QUÉ se compra (productId + cantidad), a dónde va y
 * la tarjeta. El servidor calcula el total desde la base de datos, reserva el
 * stock, cobra con Wompi y, solo si el cobro se aprueba, crea el pedido. Las
 * credenciales y el token de Wompi nunca llegan al navegador, y nada de lo
 * que se mande sobre dinero tiene efecto.
 *
 * Devuelve el pedido ya creado (con el total que se cobró de verdad). Si el
 * pago se rechaza o no hay stock, lanza un Error con un mensaje para mostrar.
 */
export const useWompi = () => {
  const [procesando, setProcesando] = useState(false);

  const pagar = async ({ products, address, phone, customerName, tarjeta }) => {
    setProcesando(true);

    try {
      const { order } = await api('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          products,
          address,
          phone,
          customerName,
          tarjeta: {
            numero: tarjeta.numero.replace(/\s/g, ''),
            cvv: tarjeta.cvv,
            mes: tarjeta.mes,
            anio: tarjeta.anio,
            titular: tarjeta.titular,
          },
        }),
      });

      return order;
    } finally {
      setProcesando(false);
    }
  };

  return { pagar, procesando };
};
