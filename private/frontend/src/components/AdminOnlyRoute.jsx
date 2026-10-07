import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

// Ruta solo para quien tiene role "admin" (p. ej. la gestión de empleados).
// Un empleado que escriba la URL a mano vuelve al dashboard. Esto es solo para
// que la pantalla no se vea: el que de verdad lo impide es el backend
// (requireRole("admin") en routes/employees.js).
const AdminOnlyRoute = ({ children }) => {
  const { admin } = useAdminAuth();
  return admin?.role === "admin" ? children : <Navigate to="/dashboard" replace />;
};

export default AdminOnlyRoute;
