import { useState } from "react";
import usePedidos from "../../hooks/usePedidos.js";
import PageHeader from "../../components/PageHeader.jsx";
import ModalConfirm from "../../components/ModalConfirm.jsx";
import { IconCart, IconMapPin, IconPhone } from "../../components/Icons.jsx";
import toast from "react-hot-toast";
import "../../components/PageHeader.css";

const ESTADOS = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

const DetallePedido = ({ pedido, onClose }) => {
  if (!pedido) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <h2 className="drawer__title">Detalle del pedido</h2>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>
        <div className="drawer__body">
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 600 }}>{pedido.customerName || "Cliente"}</p>
            <p style={{ color: "var(--text2)", fontSize: 13 }}>{pedido.customerEmail}</p>
            {pedido.address && <p style={{ color: "var(--text2)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><IconMapPin /> {pedido.address}</p>}
            {pedido.phone && <p style={{ color: "var(--text2)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><IconPhone /> {pedido.phone}</p>}
          </div>

          <h4 style={{ marginBottom: 8 }}>Productos</h4>
          {pedido.products?.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{p.name} × {p.quantity}</span>
              <span>${p.subtotal?.toFixed(2)}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, borderTop: "2px solid var(--border)", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Subtotal</span><span>${pedido.subtotal?.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Envío</span><span>{pedido.shipping === 0 ? "Gratis" : `$${pedido.shipping?.toFixed(2)}`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>IVA (13%)</span><span>${pedido.tax?.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 8 }}>
              <span>Total</span><span>${pedido.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="drawer__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const ListaPedidos = () => {
  const { pedidos, loading, actualizarEstado, eliminarPedido } = usePedidos();
  const [detalle, setDetalle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEstado = async (id, status) => {
    try {
      await actualizarEstado(id, status);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarPedido(confirmDelete._id);
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Gestión de pedidos de la tienda" />

      {loading ? (
        <div className="loading">Cargando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IconCart size={40} /></div>
          <p className="empty-state__title">No hay pedidos aún</p>
          <p className="empty-state__desc">Los pedidos aparecerán cuando los clientes compren</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido._id}>
                  <td style={{ color: "var(--text2)", fontSize: 12 }}>{pedido._id.slice(-8)}</td>
                  <td>
                    <div>
                      <strong>{pedido.customerName || "—"}</strong>
                      <p style={{ color: "var(--text2)", fontSize: 12 }}>{pedido.customerEmail}</p>
                    </div>
                  </td>
                  <td><strong>${pedido.total?.toFixed(2)}</strong></td>
                  <td>
                    <select
                      value={pedido.status}
                      onChange={(e) => handleEstado(pedido._id, e.target.value)}
                      className={`badge badge--${pedido.status}`}
                      style={{ border: "none", cursor: "pointer", background: "transparent" }}
                    >
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ color: "var(--text2)" }}>
                    {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString("es-SV") : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => setDetalle(pedido)}>Ver</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(pedido)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetallePedido pedido={detalle} onClose={() => setDetalle(null)} />

      <ModalConfirm
        isOpen={!!confirmDelete}
        title="Eliminar pedido"
        message={`¿Eliminar el pedido de "${confirmDelete?.customerName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ListaPedidos;
