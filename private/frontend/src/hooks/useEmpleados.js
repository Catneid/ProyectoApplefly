import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const useEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees", { credentials: "include" });
      const data = await res.json();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmpleados(); }, [fetchEmpleados]);

  const crearEmpleado = async (datos) => {
    const res = await fetch("/api/employees", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Empleado registrado");
    fetchEmpleados();
    return data;
  };

  const actualizarEmpleado = async (id, datos) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Empleado actualizado");
    fetchEmpleados();
    return data;
  };

  const eliminarEmpleado = async (id) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast.success("Empleado eliminado");
    fetchEmpleados();
  };

  return { empleados, loading, fetchEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado };
};

export default useEmpleados;
