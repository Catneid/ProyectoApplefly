import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useResenas } from '../hooks/useResenas.js';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from './Boton.jsx';
import './ResenasProducto.css';

// Selector de estrellas reutilizable. En modo lectura solo pinta;
// en modo edición deja elegir la calificación.
const Estrellas = ({ valor, onChange, soloLectura = false }) => (
  <div className={`estrellas ${soloLectura ? 'estrellas--lectura' : ''}`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        className={`estrellas__item ${n <= valor ? 'estrellas__item--activa' : ''}`}
        onClick={soloLectura ? undefined : () => onChange(n)}
        disabled={soloLectura}
        aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' });

const ResenasProducto = ({ productoId }) => {
  const { user } = useAuth();
  const { resenas, permiso, cargando, crearResena, editarResena, eliminarResena } = useResenas(
    productoId,
    Boolean(user)
  );

  const [editando, setEditando] = useState(false);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const promedio =
    resenas.length > 0
      ? (resenas.reduce((s, r) => s + r.rating, 0) / resenas.length).toFixed(1)
      : 0;

  const abrirEdicion = () => {
    setRating(permiso.miResena.rating);
    setComentario(permiso.miResena.comment || '');
    setEditando(true);
  };

  const enviar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (editando) {
        await editarResena(permiso.miResena._id, rating, comentario);
        toast.success('Reseña actualizada');
        setEditando(false);
      } else {
        await crearResena(rating, comentario);
        toast.success('¡Gracias por tu reseña!');
        setRating(5);
        setComentario('');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    try {
      await eliminarResena(permiso.miResena._id);
      toast.success('Reseña eliminada');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (cargando) {
    return <section className="resenas"><p className="resenas__cargando">Cargando reseñas...</p></section>;
  }

  return (
    <section className="resenas">
      <header className="resenas__header">
        <h2>Opiniones de clientes</h2>
        {resenas.length > 0 && (
          <div className="resenas__promedio">
            <Estrellas valor={Math.round(promedio)} soloLectura />
            <span>{promedio} de 5 · {resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'}</span>
          </div>
        )}
      </header>

      {/* Qué se muestra depende de la situación del visitante:
          sin sesión / no lo compró / ya opinó / puede opinar */}
      {!user && (
        <div className="resenas__aviso">
          <Link to="/login">Inicia sesión</Link> para dejar tu opinión sobre este producto.
        </div>
      )}

      {user && !permiso.comprado && (
        <div className="resenas__aviso">
          Solo los clientes que compraron este producto pueden valorarlo.
        </div>
      )}

      {user && permiso.miResena && !editando && (
        <article className="resenas__mia">
          <div className="resenas__mia-header">
            <strong>Tu reseña</strong>
            <div className="resenas__mia-acciones">
              <button onClick={abrirEdicion}>Editar</button>
              <button onClick={borrar} className="resenas__borrar">Eliminar</button>
            </div>
          </div>
          <Estrellas valor={permiso.miResena.rating} soloLectura />
          {permiso.miResena.comment && <p>{permiso.miResena.comment}</p>}
        </article>
      )}

      {user && (permiso.puedeResenar || editando) && (
        <form onSubmit={enviar} className="resenas__form">
          <h3>{editando ? 'Edita tu reseña' : '¿Qué te pareció?'}</h3>

          <div className="resenas__campo">
            <label>Tu calificación</label>
            <Estrellas valor={rating} onChange={setRating} />
          </div>

          <div className="resenas__campo">
            <label>Tu comentario (opcional)</label>
            <textarea
              rows={4}
              maxLength={500}
              value={comentario}
              placeholder="Cuéntanos tu experiencia con este producto..."
              onChange={(e) => setComentario(e.target.value)}
            />
            <small>{comentario.length}/500</small>
          </div>

          <div className="resenas__form-acciones">
            {editando && (
              <Boton texto="Cancelar" variante="ghost" onClick={() => setEditando(false)} />
            )}
            <Boton
              texto={guardando ? 'Enviando...' : editando ? 'Guardar cambios' : 'Publicar reseña'}
              tipo="submit"
              variante="primary"
              deshabilitado={guardando}
            />
          </div>
        </form>
      )}

      {resenas.length === 0 ? (
        <p className="resenas__vacio">Este producto aún no tiene reseñas. ¡Sé el primero!</p>
      ) : (
        <div className="resenas__lista">
          {resenas.map((resena) => (
            <article key={resena._id} className="resena">
              <div className="resena__avatar">{resena.customerName?.charAt(0).toUpperCase() || '?'}</div>
              <div className="resena__cuerpo">
                <div className="resena__header">
                  <strong>{resena.customerName || 'Cliente'}</strong>
                  <span className="resena__fecha">{formatearFecha(resena.createdAt)}</span>
                </div>
                <Estrellas valor={resena.rating} soloLectura />
                {resena.comment && <p className="resena__comentario">{resena.comment}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ResenasProducto;
