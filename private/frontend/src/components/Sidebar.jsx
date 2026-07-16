import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";
import {
  IconDashboard, IconBox, IconTag,
  IconUsers, IconUser, IconCart, IconLogout, IconClose,
} from "./Icons.jsx";
import "./Sidebar.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { to: "/productos", label: "Productos", icon: <IconBox /> },
  { to: "/categorias", label: "Categorías", icon: <IconTag /> },
  { to: "/empleados", label: "Empleados", icon: <IconUsers /> },
  { to: "/clientes", label: "Clientes", icon: <IconUser /> },
  { to: "/pedidos", label: "Pedidos", icon: <IconCart /> },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  return (
    <aside className={"sidebar" + (open ? " sidebar--open" : "")}>
      <div className="sidebar__brand">
        <img src={logo} alt="Applefly" className="sidebar__logo" />
        <div>
          <p className="sidebar__brand-name">Applefly</p>
          <p className="sidebar__brand-sub">Panel Admin</p>
        </div>
        <button
          className="sidebar__close"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <IconClose size={20} />
        </button>
      </div>

      <div className="sidebar__user">
        <div className="sidebar__avatar">{admin?.name?.[0]?.toUpperCase() || "A"}</div>
        <div>
          <p className="sidebar__user-name">{admin?.name || "Admin"}</p>
          <p className="sidebar__user-role">{admin?.role || "empleado"}</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              "sidebar__link" + (isActive ? " sidebar__link--active" : "")
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__logout" onClick={handleLogout}>
        <IconLogout />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
};

export default Sidebar;
