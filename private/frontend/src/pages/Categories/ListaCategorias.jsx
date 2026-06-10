import { useState } from "react";
import { useForm } from "react-hook-form";
import useCategorias from "../../hooks/useCategorias.js";
import PageHeader from "../../components/PageHeader.jsx";
import ModalConfirm from "../../components/ModalConfirm.jsx";
import { IconTag } from "../../components/Icons.jsx";
import toast from "react-hot-toast";
import "../../components/PageHeader.css";

const CategoriaDrawer = ({ isOpen, onClose, categoriaEditar, onSave }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: categoriaEditar || { name: "", description: "" },
  });

  const onSubmit = async (data) => {
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description || "");
      if (data.image?.[0]) fd.append("image", data.image[0]);
      await onSave(fd);
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
          <h2 className="drawer__title">{categoriaEditar ? "Editar categoría" : "Nueva categoría"}</h2>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="drawer__body">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className={`form-input ${errors.name ? "error" : ""}`}
                {...register("name", { required: "Nombre requerido" })} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" rows={3} {...register("description")} />
            </div>
            <div className="form-group">
              <label className="form-label">Imagen</label>
              <input type="file" accept="image/*" className="form-input" {...register("image")} />
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

const ListaCategorias = () => {
  const { categorias, loading, crearCategoria, actualizarCategoria, eliminarCategoria } = useCategorias();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (fd) => {
    if (editando) await actualizarCategoria(editando._id, fd);
    else await crearCategoria(fd);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarCategoria(confirmDelete._id);
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
        title="Categorías"
        subtitle="Gestiona las categorías de productos"
        action={
          <button className="btn btn--primary" onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            + Nueva categoría
          </button>
        }
      />

      {loading ? (
        <div className="loading">Cargando categorías...</div>
      ) : categorias.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IconTag size={40} /></div>
          <p className="empty-state__title">No hay categorías</p>
          <p className="empty-state__desc">Crea tu primera categoría</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                    ) : <span style={{ color: "#ccc" }}>—</span>}
                  </td>
                  <td><strong>{cat.name}</strong></td>
                  <td style={{ color: "var(--text2)" }}>{cat.description || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => { setEditando(cat); setDrawerOpen(true); }}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(cat)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoriaDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} categoriaEditar={editando} onSave={handleSave} />

      <ModalConfirm
        isOpen={!!confirmDelete}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ListaCategorias;
