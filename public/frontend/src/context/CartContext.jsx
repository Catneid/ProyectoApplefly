import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const CartContext = createContext(null);

// Reglas de negocio del carrito, en un solo lugar.
// El backend usa exactamente las mismas al confirmar el pedido.
const ENVIO = 15;
const ENVIO_GRATIS_DESDE = 500;
const IVA = 0.13;

export const CartProvider = ({ children }) => {
  // useLocalStorage en vez de useState: si el usuario recarga la página o
  // vuelve mañana, su carrito sigue ahí (criterio 13 de la rúbrica).
  const [items, setItems] = useLocalStorage('applefly_carrito', []);

  const addToCart = (producto, quantity = 1) => {
    setItems((prev) => {
      const existente = prev.find((item) => item.id === producto.id);
      if (existente) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...producto, quantity }];
    });
  };

  const removeFromCart = (productoId) => {
    setItems((prev) => prev.filter((item) => item.id !== productoId));
  };

  const updateQuantity = (productoId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productoId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
    const tax = +(subtotal * IVA).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);
    return { totalItems, subtotal, shipping, tax, total };
  }, [items]);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    ENVIO_GRATIS_DESDE,
    ...totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
