import { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addToCart = (phone, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === phone.id);
      if (existing) {
        return prev.map((item) =>
          item.id === phone.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...phone, quantity }];
    });
  };

  const removeFromCart = (phoneId) => {
    setItems((prev) => prev.filter((item) => item.id !== phoneId));
  };

  const updateQuantity = (phoneId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(phoneId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === phoneId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 500 ? 0 : subtotal === 0 ? 0 : 15;
    const tax = +(subtotal * 0.13).toFixed(2); // IVA El Salvador
    const total = +(subtotal + shipping + tax).toFixed(2);
    return { totalItems, subtotal, shipping, tax, total };
  }, [items]);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
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
