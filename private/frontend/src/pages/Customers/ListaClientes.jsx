import { useState } from "react";
import useClientes from "../../hooks/useClientes.js";
import PageHeader from "../../components/PageHeader.jsx";
import ModalConfirm from "../../components/ModalConfirm.jsx";
import { IconUser } from "../../components/Icons.jsx";
import toast from "react-hot-toast";
import "../../components/PageHeader.css";

const ListaClientes = () => {
  const { clientes, loading, eliminarCliente } = useClientes();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarCliente(confirmDelete._id);
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Clientes registrados en la tienda" />

      {loading ? (
        <div className="loading">Cargando clientes...</div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IconUser size={40} /></div>
          <p className="empty-state__title">No hay clientes registrados</p>
          <p className="empty-state__desc">Los clientes aparecerán aquí cuando se registren</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Verificado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={c._id}>
                  <td style={{ color: "var(--text2)" }}>{i + 1}</td>
                  <td><strong>{c.name} {c.lastName}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td>
                    <span className={`badge ${c.isVerified ? "badge--entregado" : "badge--cancelado"}`}>
                      {c.isVerified ? "Sí" : "No"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-SV") : "—"}
                  </td>
                  <td>
                    <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(c)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalConfirm
        isOpen={!!confirmDelete}
        title="Eliminar cliente"
        message={`¿Eliminar al cliente "${confirmDelete?.name} ${confirmDelete?.lastName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ListaClientes;
