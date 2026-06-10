import { useState } from "react";
import { useForm } from "react-hook-form";
import useEmpleados from "../../hooks/useEmpleados.js";
import PageHeader from "../../components/PageHeader.jsx";
import ModalConfirm from "../../components/ModalConfirm.jsx";
import { IconUsers } from "../../components/Icons.jsx";
import toast from "react-hot-toast";
import "../../components/PageHeader.css";

const EmpleadoDrawer = ({ isOpen, onClose, empleadoEditar, onSave }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: empleadoEditar
      ? { ...empleadoEditar, password: "" }
      : { name: "", lastName: "", email: "", password: "", salary: "", DUI: "", phone: "", role: "empleado" },
  });

  const onSubmit = async (data) => {
    try {
      await onSave(data);
      reset();
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <h2 className="drawer__title">{empleadoEditar ? "Editar empleado" : "Nuevo empleado"}</h2>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="drawer__body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className={`form-input ${errors.name ? "error" : ""}`}
                  {...register("name", { required: "Requerido" })} />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <input className={`form-input ${errors.lastName ? "error" : ""}`}
                  {...register("lastName", { required: "Requerido" })} />
                {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo *</label>
              <input type="email" className={`form-input ${errors.email ? "error" : ""}`}
                {...register("email", { required: "Requerido", pattern: { value: /^\S+@\S+$/i, message: "Correo inválido" } })} />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{empleadoEditar ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</label>
              <input type="password" className={`form-input ${errors.password ? "error" : ""}`}
                {...register("password", empleadoEditar ? {} : { required: "Requerido", minLength: { value: 6, message: "Mínimo 6 caracteres" } })} />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">DUI</label>
                <input className="form-input" {...register("DUI")} placeholder="00000000-0" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" {...register("phone")} placeholder="0000-0000" />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Salario ($)</label>
                <input type="number" step="0.01" className="form-input" {...register("salary")} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-input" {...register("role")}>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div className="drawer__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListaEmpleados = () => {
  const { empleados, loading, crearEmpleado, actualizarEmpleado, eliminarEmpleado } = useEmpleados();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (data) => {
    if (editando) await actualizarEmpleado(editando._id, data);
    else await crearEmpleado(data);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarEmpleado(confirmDelete._id);
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Empleados"
        subtitle="Gestiona el personal de la tienda"
        action={
          <button className="btn btn--primary" onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            + Nuevo empleado
          </button>
        }
      />

      {loading ? (
        <div className="loading">Cargando empleados...</div>
      ) : empleados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IconUsers size={40} /></div>
          <p className="empty-state__title">No hay empleados registrados</p>
          <p className="empty-state__desc">Registra al primer empleado</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>DUI</th>
                <th>Teléfono</th>
                <th>Salario</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp._id}>
                  <td><strong>{emp.name} {emp.lastName}</strong></td>
                  <td>{emp.email}</td>
                  <td>{emp.DUI || "—"}</td>
                  <td>{emp.phone || "—"}</td>
                  <td>${emp.salary?.toFixed(2) || "0.00"}</td>
                  <td>
                    <span className={`badge ${emp.role === "admin" ? "badge--procesando" : "badge--enviado"}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => { setEditando(emp); setDrawerOpen(true); }}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(emp)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmpleadoDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} empleadoEditar={editando} onSave={handleSave} />

      <ModalConfirm
        isOpen={!!confirmDelete}
        title="Eliminar empleado"
        message={`¿Eliminar a "${confirmDelete?.name} ${confirmDelete?.lastName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ListaEmpleados;
