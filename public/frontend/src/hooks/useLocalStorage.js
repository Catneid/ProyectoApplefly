import { useState, useEffect } from 'react';

/**
 * Igual que useState, pero el valor sobrevive a que el usuario recargue
 * la página. Lo usa el carrito para no perder los productos.
 */
export const useLocalStorage = (clave, valorInicial) => {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado ? JSON.parse(guardado) : valorInicial;
    } catch {
      // Si lo guardado está corrupto, arrancamos limpio en vez de reventar
      return valorInicial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Puede fallar si el navegador tiene el almacenamiento lleno o
      // bloqueado (modo incógnito estricto). No es motivo para romper la app.
    }
  }, [clave, valor]);

  return [valor, setValor];
};
