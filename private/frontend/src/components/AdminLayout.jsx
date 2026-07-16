import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { IconMenu } from "./Icons.jsx";
import "../App.css";

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú al cambiar de ruta (útil en móvil)
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && (
        <div className="admin-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-topbar__toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>
          <span className="admin-topbar__title">Applefly Admin</span>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
