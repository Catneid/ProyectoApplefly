import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const usePedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { credentials: "include" });
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const actualizarEstado = async (id, status) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Estado actualizado");
    fetchPedidos();
    return data;
  };

  const eliminarPedido = async (id) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Pedido eliminado");
    fetchPedidos();
  };

  return { pedidos, loading, fetchPedidos, actualizarEstado, eliminarPedido };
};

export default usePedidos;
