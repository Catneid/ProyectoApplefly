import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers", { credentials: "include" });
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const eliminarCliente = async (id) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Cliente eliminado");
    fetchClientes();
  };

  return { clientes, loading, fetchClientes, eliminarCliente };
};

export default useClientes;
