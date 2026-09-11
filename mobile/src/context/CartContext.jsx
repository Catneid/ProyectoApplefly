import { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

const CLAVE_STORAGE = 'applefly_carrito';

// Mismas constantes que public/frontend/src/context/CartContext.jsx, para
// que el total que ve alguien en la app sea igual al que vería en la web.
const ENVIO = 15;
const ENVIO_GRATIS_DESDE = 500;
const IVA = 0.13;

// Mismo espíritu que el hook useLocalStorage de la web, pero AsyncStorage es
// asíncrono: arrancamos en [] y actualizamos en cuanto responde, en vez de
// bloquear el primer render esperándolo.
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Evita que la primera escritura (disparada por el setItems del propio
  // useEffect de carga) pise el storage con [] antes de haber leído nada.
  const yaCargado = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_STORAGE);
        if (guardado) setItems(JSON.parse(guardado));
      } catch (e) {
        console.warn('[carrito] No se pudo leer el carrito guardado:', e.message);
      } finally {
        yaCargado.current = true;
        setCargando(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!yaCargado.current) return;
    AsyncStorage.setItem(CLAVE_STORAGE, JSON.stringify(items)).catch((e) => {
      console.warn('[carrito] No se pudo guardar el carrito:', e.message);
    });
  }, [items]);

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setItems((actuales) => {
      const existente = actuales.find((item) => item.productId === producto.id);
      if (existente) {
        return actuales.map((item) =>
          item.productId === producto.id
            ? { ...item, quantity: item.quantity + cantidad }
            : item
        );
      }
      return [
        ...actuales,
        {
          productId: producto.id,
          name: producto.name,
          price: producto.price,
          image: producto.image ?? null,
          quantity: cantidad,
        },
      ];
    });
  };

  const quitarDelCarrito = (productId) => {
    setItems((actuales) => actuales.filter((item) => item.productId !== productId));
  };

  const actualizarCantidad = (productId, cantidad) => {
    if (cantidad < 1) {
      quitarDelCarrito(productId);
      return;
    }
    setItems((actuales) =>
      actuales.map((item) => (item.productId === productId ? { ...item, quantity: cantidad } : item))
    );
  };

  const vaciarCarrito = () => setItems([]);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const cantidadTotal = items.reduce((total, item) => total + item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
  const tax = +(subtotal * IVA).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  return (
    <CartContext.Provider
      value={{
        items,
        cargando,
        agregarAlCarrito,
        quitarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        subtotal,
        cantidadTotal,
        shipping,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
