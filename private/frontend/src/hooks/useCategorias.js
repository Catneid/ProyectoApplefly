import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const useCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { credentials: "include" });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  const crearCategoria = async (formData) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Categoría creada");
    fetchCategorias();
    return data;
  };

  const actualizarCategoria = async (id, formData) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Categoría actualizada");
    fetchCategorias();
    return data;
  };

  const eliminarCategoria = async (id) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Categoría eliminada");
    fetchCategorias();
  };

  return { categorias, loading, fetchCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };
};

export default useCategorias;
