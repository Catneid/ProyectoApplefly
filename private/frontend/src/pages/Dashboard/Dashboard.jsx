import { useState, useEffect } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { IconBox, IconUser, IconCart, IconCalendar, IconPlus, IconTag, IconUsers } from "../../components/Icons.jsx";
import "./Dashboard.css";

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderTopColor: color }}>
    <div className="stat-card__icon" style={{ background: color + "1a", color }}>{icon}</div>
    <div>
      <p className="stat-card__value">{value ?? "—"}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({ products: null, customers: null, orders: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [p, c, o] = await Promise.all([
          fetch("/api/products/count", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/customers/count", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/orders/count", { credentials: "include" }).then((r) => r.json()),
        ]);
        setStats({ products: p.count, customers: c.count, orders: o.count });
      } catch {
        /* ignore */
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="dashboard__welcome">
        <h1>Bienvenido, {admin?.name}</h1>
        <p>Panel de administración de Applefly</p>
      </div>

      <div className="dashboard__stats">
        <StatCard icon={<IconBox size={22} />} label="Productos" value={stats.products} color="#0071e3" />
        <StatCard icon={<IconUser size={22} />} label="Clientes" value={stats.customers} color="#22c55e" />
        <StatCard icon={<IconCart size={22} />} label="Pedidos" value={stats.orders} color="#f59e0b" />
        <StatCard icon={<IconCalendar size={22} />} label="Fecha" value={new Date().toLocaleDateString("es-SV")} color="#a855f7" />
      </div>

      <div className="dashboard__cards">
        <div className="card">
          <h3>Accesos rápidos</h3>
          <ul className="dashboard__links">
            <li><a href="/productos"><IconPlus size={14} /> Agregar producto</a></li>
            <li><a href="/categorias"><IconTag size={14} /> Gestionar categorías</a></li>
            <li><a href="/pedidos"><IconCart size={14} /> Ver pedidos</a></li>
            <li><a href="/empleados"><IconUsers size={14} /> Registrar empleado</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
