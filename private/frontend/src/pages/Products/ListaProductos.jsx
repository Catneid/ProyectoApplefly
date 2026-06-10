import { useState } from "react";
import { useForm } from "react-hook-form";
import useProductos from "../../hooks/useProductos.js";
import useCategorias from "../../hooks/useCategorias.js";
import PageHeader from "../../components/PageHeader.jsx";
import ModalConfirm from "../../components/ModalConfirm.jsx";
import { IconBox } from "../../components/Icons.jsx";
import toast from "react-hot-toast";
import "../../components/PageHeader.css";

const ProductoDrawer = ({ isOpen, onClose, productoEditar, categorias, onSave }) => {
  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting }, reset,
  } = useForm({
    defaultValues: productoEditar
      ? {
          ...productoEditar,
          category: productoEditar.category?._id || productoEditar.category || "",
        }
      : {
          name: "", description: "", price: "", originalPrice: "", discount: "0",
          stock: "", category: "", condition: "Nuevo", storage: "", ram: "",
          color: "", featured: false,
        },
  });

  const [preview, setPreview] = useState(productoEditar?.image || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key !== "image" && val !== undefined && val !== null) fd.append(key, val);
      });
      if (data.image?.[0]) fd.append("image", data.image[0]);
      await onSave(fd);
      reset();
      setPreview(null);
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <h2 className="drawer__title">{productoEditar ? "Editar producto" : "Nuevo producto"}</h2>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="drawer__body">
            <div className="form-group">
              <label className="form-label">Nombre del producto *</label>
              <input className={`form-input ${errors.name ? "error" : ""}`}
                placeholder="iPhone 15 Pro Max"
                {...register("name", { required: "Nombre requerido" })} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" rows={3} placeholder="Descripción del producto..." {...register("description")} />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Precio ($) *</label>
                <input type="number" step="0.01" className={`form-input ${errors.price ? "error" : ""}`}
                  placeholder="999.99"
                  {...register("price", { required: "Requerido", min: { value: 0, message: "Debe ser positivo" } })} />
                {errors.price && <span className="form-error">{errors.price.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Precio original ($)</label>
                <input type="number" step="0.01" className="form-input" placeholder="1199.99" {...register("originalPrice")} />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Descuento (%)</label>
                <input type="number" min="0" max="100" className="form-input" placeholder="0" {...register("discount")} />
                <span style={{ fontSize: 12, color: "var(--text2)" }}>0 = sin descuento</span>
              </div>
              <div className="form-group">
                <label className="form-label">Stock *</label>
                <input type="number" min="0" className={`form-input ${errors.stock ? "error" : ""}`}
                  placeholder="10"
                  {...register("stock", { required: "Requerido", min: 0 })} />
                {errors.stock && <span className="form-error">{errors.stock.message}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" {...register("category")}>
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Condición</label>
                <select className="form-input" {...register("condition")}>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Reacondicionado">Reacondicionado</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Almacenamiento</label>
                <input className="form-input" placeholder="256GB" {...register("storage")} />
              </div>
              <div className="form-group">
                <label className="form-label">RAM</label>
                <input className="form-input" placeholder="8GB" {...register("ram")} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" placeholder="Titanio Natural" {...register("color")} />
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" {...register("featured")} />
                <span className="form-label" style={{ marginBottom: 0 }}>Producto destacado</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Imagen del producto</label>
              {preview && (
                <img src={preview} alt="preview" style={{ width: "100%", height: 160, objectFit: "contain", borderRadius: 8, background: "#f5f5f7", marginBottom: 8 }} />
              )}
              <input type="file" accept="image/*" className="form-input"
                {...register("image")}
                onChange={(e) => { register("image").onChange(e); handleImageChange(e); }}
              />
            </div>
          </div>
          <div className="drawer__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListaProductos = () => {
  const { productos, loading, crearProducto, actualizarProducto, eliminarProducto } = useProductos();
  const { categorias } = useCategorias();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (fd) => {
    if (editando) await actualizarProducto(editando._id, fd);
    else await crearProducto(fd);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarProducto(confirmDelete._id);
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
        title="Productos"
        subtitle={`${productos.length} productos en catálogo`}
        action={
          <button className="btn btn--primary" onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            + Agregar producto
          </button>
        }
      />

      {loading ? (
        <div className="loading">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><IconBox size={40} /></div>
          <p className="empty-state__title">No hay productos</p>
          <p className="empty-state__desc">Agrega el primer producto a la tienda</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Stock</th>
                <th>Condición</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod._id}>
                  <td>
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", background: "#f5f5f7" }} />
                    ) : <span style={{ color: "#ccc" }}><IconBox size={28} /></span>}
                  </td>
                  <td>
                    <div>
                      <strong>{prod.name}</strong>
                      {prod.featured && <span style={{ marginLeft: 6, fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>DESTACADO</span>}
                      {prod.storage && <p style={{ color: "var(--text2)", fontSize: 12 }}>{prod.storage} {prod.color && `· ${prod.color}`}</p>}
                    </div>
                  </td>
                  <td style={{ color: "var(--text2)" }}>{prod.category?.name || "—"}</td>
                  <td>
                    <div>
                      <strong>${prod.price?.toFixed(2)}</strong>
                      {prod.originalPrice && <p style={{ color: "var(--text2)", fontSize: 12, textDecoration: "line-through" }}>${prod.originalPrice?.toFixed(2)}</p>}
                    </div>
                  </td>
                  <td>
                    {prod.discount > 0 ? (
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        -{prod.discount}%
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <span style={{ color: prod.stock <= 5 ? "var(--danger)" : "var(--text)", fontWeight: prod.stock <= 5 ? 600 : 400 }}>
                      {prod.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${prod.condition === "Nuevo" ? "badge--entregado" : "badge--procesando"}`}>
                      {prod.condition}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => { setEditando(prod); setDrawerOpen(true); }}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(prod)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductoDrawer
        key={editando?._id || "new"}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productoEditar={editando}
        categorias={categorias}
        onSave={handleSave}
      />

      <ModalConfirm
        isOpen={!!confirmDelete}
        title="Eliminar producto"
        message={`¿Eliminar el producto "${confirmDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ListaProductos;
