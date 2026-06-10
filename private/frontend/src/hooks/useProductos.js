import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", { credentials: "include" });
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const crearProducto = async (formData) => {
    const res = await fetch("/api/products", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Producto creado");
    fetchProductos();
    return data;
  };

  const actualizarProducto = async (id, formData) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Producto actualizado");
    fetchProductos();
    return data;
  };

  const eliminarProducto = async (id) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Producto eliminado");
    fetchProductos();
  };

  return { productos, loading, fetchProductos, crearProducto, actualizarProducto, eliminarProducto };
};

export default useProductos;
