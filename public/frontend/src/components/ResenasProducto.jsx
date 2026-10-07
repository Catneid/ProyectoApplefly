import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useResenas } from '../hooks/useResenas.js';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from './Boton.jsx';
import { COMENTARIO, errorCalificacion, errorComentario } from '../utils/validaciones.js';
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
  // Sin estrella elegida de entrada: la calificación es obligatoria
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  const promedio =
    resenas.length > 0
      ? (resenas.reduce((s, r) => s + r.rating, 0) / resenas.length).toFixed(1)
      : 0;

  const abrirEdicion = () => {
    setRating(permiso.miResena.rating);
    setComentario(permiso.miResena.comment || '');
    setErrores({});
    setEditando(true);
  };

  const enviar = async (e) => {
    e.preventDefault();

    // Mismas reglas que el servidor: estrellas de 1 a 5 y comentario de 3 a 500
    const nuevos = {};
    const errorRating = errorCalificacion(rating);
    const errorTexto = errorComentario(comentario);
    if (errorRating) nuevos.rating = errorRating;
    if (errorTexto) nuevos.comentario = errorTexto;
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);

    try {
      if (editando) {
        await editarResena(permiso.miResena._id, rating, comentario.trim());
        toast.success('Reseña actualizada');
        setEditando(false);
      } else {
        await crearResena(rating, comentario.trim());
        toast.success('¡Gracias por tu reseña!');
        setRating(0);
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
        <form onSubmit={enviar} className="resenas__form" noValidate>
          <h3>{editando ? 'Edita tu reseña' : '¿Qué te pareció?'}</h3>

          <div className="resenas__campo">
            <label>Tu calificación</label>
            <Estrellas
              valor={rating}
              onChange={(n) => {
                setRating(n);
                setErrores((prev) => ({ ...prev, rating: undefined }));
              }}
            />
            {errores.rating && <span className="resenas__error">{errores.rating}</span>}
          </div>

          <div className="resenas__campo">
            <label>Tu comentario *</label>
            <textarea
              rows={4}
              maxLength={COMENTARIO.max}
              value={comentario}
              placeholder={`Cuéntanos tu experiencia con este producto (${COMENTARIO.min} a ${COMENTARIO.max} caracteres)...`}
              onChange={(e) => {
                setComentario(e.target.value);
                setErrores((prev) => ({ ...prev, comentario: undefined }));
              }}
            />
            {errores.comentario && <span className="resenas__error">{errores.comentario}</span>}
            <small>{comentario.length}/{COMENTARIO.max}</small>
          </div>

          <div className="resenas__form-acciones">
            {editando && (
              <Boton texto="Cancelar" variante="ghost" onClick={() => { setEditando(false); setErrores({}); }} />
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
