import { Link } from 'react-router-dom';
import { useProductos } from '../context/ProductosContext.jsx';
import './SeccionCategorias.css';

const ICONOS = {
  iPhone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  ),
  iPad: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="11" y1="19" x2="13" y2="19" />
    </svg>
  ),
  MacBook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="11" rx="1" />
      <line x1="2" y1="19" x2="22" y2="19" />
    </svg>
  ),
  'Apple Watch': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 7V4h6v3" />
      <path d="M9 17v3h6v-3" />
    </svg>
  ),
  AirPods: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="7" cy="16" rx="2.5" ry="3.5" />
      <ellipse cx="17" cy="16" rx="2.5" ry="3.5" />
      <path d="M7 12.5V8a5 5 0 0 1 10 0v4.5" />
    </svg>
  ),
};

const IconoDefault = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const SeccionCategorias = () => {
  const { categorias, loading } = useProductos();

  if (loading || categorias.length === 0) return null;

  return (
    <section className="categorias">
      <div className="container">
        <h2 className="categorias__titulo">Explora por categoría</h2>
        <p className="categorias__subtitulo">
          Encuentra el dispositivo Apple perfecto para ti
        </p>
        <div className="categorias__grid">
          {categorias.map((cat) => (
            <Link
              key={cat._id}
              to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
              className="categorias__card"
            >
              <div className="categorias__icono">
                {ICONOS[cat.name] || IconoDefault}
              </div>
              <div className="categorias__card-inner">
                <h3>{cat.name}</h3>
                {cat.description && <p>{cat.description}</p>}
                <span className="categorias__flecha">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionCategorias;
