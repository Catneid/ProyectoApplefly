import { Link } from 'react-router-dom';
import TelefonoCard from './TelefonoCard.jsx';
import { useProductos } from '../context/ProductosContext.jsx';
import './SeccionDestacados.css';

const SeccionDestacados = () => {
  const { productos, loading } = useProductos();

  const destacados = productos
    .filter((p) => p.featured)
    .slice(0, 8);

  const mostrar = destacados.length > 0
    ? destacados
    : productos.slice(0, 8);

  if (loading) {
    return (
      <section className="destacados">
        <div className="container">
          <div className="destacados__header">
            <div>
              <h2 className="destacados__titulo">Productos destacados</h2>
              <p className="destacados__subtitulo">Los favoritos de nuestros clientes</p>
            </div>
          </div>
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0' }}>Cargando productos...</p>
        </div>
      </section>
    );
  }

  if (mostrar.length === 0) return null;

  return (
    <section className="destacados">
      <div className="container">
        <div className="destacados__header">
          <div>
            <h2 className="destacados__titulo">Productos destacados</h2>
            <p className="destacados__subtitulo">Los favoritos de nuestros clientes</p>
          </div>
          <Link to="/catalogo" className="destacados__ver-todo">
            Ver todos →
          </Link>
        </div>

        <div className="destacados__grid">
          {mostrar.map((telefono) => (
            <TelefonoCard key={telefono.id} telefono={telefono} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionDestacados;
