import { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { calcularTotales } from '../services/precios';

const CartContext = createContext(null);

// v2: antes los productos eran de Firestore y el carrito guardaba esos ids.
// Ahora el catálogo es el de MongoDB, con otros ids, así que un carrito viejo
// ya no sirve: se usa una clave nueva y la vieja se borra.
const CLAVE_STORAGE = 'applefly_carrito_v2';
const CLAVE_STORAGE_VIEJA = 'applefly_carrito';

// Tope de unidades que se pueden tener de un producto: su stock. Un item viejo
// (guardado antes de que el carrito recordara el stock) no trae el dato y no
// tiene tope; el checkout lo corrige al revisar el catálogo.
const tope = (stock) => (Number.isFinite(stock) ? Math.max(stock, 0) : Infinity);

// Mismo espíritu que el hook useLocalStorage de la web, pero AsyncStorage es
// asíncrono: arrancamos en [] y actualizamos en cuanto responde, en vez de
// bloquear el primer render esperándolo.
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Evita que la primera escritura (disparada por el setItems del propio
  // useEffect de carga) pise el storage con [] antes de haber leído nada.
  const yaCargado = useRef(false);

  // Copia del carrito siempre al día (se asigna en cada render) para decidir
  // en el momento de tocar "agregar" sin esperar al siguiente render.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    (async () => {
      try {
        AsyncStorage.removeItem(CLAVE_STORAGE_VIEJA).catch(() => {});
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

  // Devuelve { agregadas, motivo }: cuántas unidades se agregaron de verdad.
  // motivo = 'agotado' (stock 0) o 'maximo' (ya hay en el carrito todo el
  // stock) cuando no entró todo lo pedido; undefined si entró todo.
  const agregarAlCarrito = (producto, cantidad = 1) => {
    const maximo = tope(producto.stock);
    if (maximo === 0) return { agregadas: 0, motivo: 'agotado' };

    const enCarrito = itemsRef.current.find((item) => item.productId === producto.id)?.quantity ?? 0;
    const agregadas = Math.max(Math.min(cantidad, maximo - enCarrito), 0);

    if (agregadas > 0) {
      setItems((actuales) => {
        const existente = actuales.find((item) => item.productId === producto.id);
        if (existente) {
          return actuales.map((item) =>
            item.productId === producto.id
              ? {
                  ...item,
                  // Se refresca el stock y el precio con lo último que se vio
                  stock: producto.stock,
                  price: producto.price,
                  quantity: Math.min(item.quantity + agregadas, maximo),
                }
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
            stock: producto.stock,
            quantity: agregadas,
          },
        ];
      });
    }

    return { agregadas, motivo: agregadas < cantidad ? 'maximo' : undefined };
  };

  const quitarDelCarrito = (productId) => {
    setItems((actuales) => actuales.filter((item) => item.productId !== productId));
  };

  // Devuelve false si se pidió más de lo que hay en stock (se deja en el máximo).
  const actualizarCantidad = (productId, cantidad) => {
    if (cantidad < 1) {
      quitarDelCarrito(productId);
      return true;
    }

    const item = itemsRef.current.find((i) => i.productId === productId);
    const maximo = tope(item?.stock);
    setItems((actuales) =>
      actuales.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(cantidad, tope(i.stock)) } : i
      )
    );
    return cantidad <= maximo;
  };

  // Reemplaza el carrito completo (lo usa el checkout al reconciliarlo con el catálogo)
  const reemplazarItems = (nuevos) => setItems(nuevos);

  const vaciarCarrito = () => setItems([]);

  // Mismo cálculo, con las mismas funciones, que el servidor al cobrar
  // (public/backend/src/utils/precios.js): ni un centavo de diferencia.
  const subtotalBruto = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const cantidadTotal = items.reduce((total, item) => total + item.quantity, 0);
  const totales = calcularTotales(subtotalBruto);
  const subtotal = totales.subtotal;
  // Carrito vacío: no hay nada que enviar, así que tampoco se muestra envío
  const shipping = items.length === 0 ? 0 : totales.shipping;
  const tax = totales.tax;
  const total = items.length === 0 ? 0 : totales.total;

  return (
    <CartContext.Provider
      value={{
        items,
        cargando,
        agregarAlCarrito,
        quitarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        reemplazarItems,
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
