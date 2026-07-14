import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProductosContext = createContext(null);

export const normalizeProducto = (p) => ({
  ...p,
  id: p._id,
  category: p.category?.name || p.category || 'Sin categoría',
  categoryId: p.category?._id || p.category || null,
  image: p.image || null,
  rating: p.rating || 0,
  reviews: p.reviews || 0,
  specs: p.specs || {},
  originalPrice: p.originalPrice || null,
  discount: p.discount || 0,
});

export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const traerCatalogo = async () => {
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories'),
    ]);
    const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);

    return {
      productos: Array.isArray(prodData) ? prodData.map(normalizeProducto) : [],
      categorias: Array.isArray(catData) ? catData : [],
    };
  };

  // La carga inicial no toca el estado antes del primer await: hacerlo de
  // forma síncrona dentro del efecto dispara renders en cascada.
  useEffect(() => {
    let activo = true;

    traerCatalogo()
      .then(({ productos, categorias }) => {
        if (!activo) return;
        setProductos(productos);
        setCategorias(categorias);
      })
      .catch(() => activo && setError('No se pudo conectar con el servidor'))
      .finally(() => activo && setLoading(false));

    return () => {
      activo = false;
    };
  }, []);

  // Se llama a mano (por ejemplo tras una compra, para refrescar el stock)
  const fetchTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { productos, categorias } = await traerCatalogo();
      setProductos(productos);
      setCategorias(categorias);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ProductosContext.Provider value={{ productos, categorias, loading, error, refreshProductos: fetchTodo }}>
      {children}
    </ProductosContext.Provider>
  );
};

export const useProductos = () => {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductos debe usarse dentro de ProductosProvider');
  return ctx;
};
