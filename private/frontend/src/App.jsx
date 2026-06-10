import { Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import LoginAdmin from "./pages/Login/LoginAdmin.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import ListaProductos from "./pages/Products/ListaProductos.jsx";
import ListaCategorias from "./pages/Categories/ListaCategorias.jsx";
import ListaEmpleados from "./pages/Employees/ListaEmpleados.jsx";
import ListaClientes from "./pages/Customers/ListaClientes.jsx";
import ListaPedidos from "./pages/Orders/ListaPedidos.jsx";

const PrivateRoute = ({ children }) => {
  const { admin } = useAdminAuth();
  return admin ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginAdmin />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<ListaProductos />} />
        <Route path="categorias" element={<ListaCategorias />} />
        <Route path="empleados" element={<ListaEmpleados />} />
        <Route path="clientes" element={<ListaClientes />} />
        <Route path="pedidos" element={<ListaPedidos />} />
      </Route>
    </Routes>
  );
}

export default App;
