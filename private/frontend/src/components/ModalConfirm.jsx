import "./ModalConfirm.css";

const ModalConfirm = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
