import { Link } from 'react-router-dom';
import TelefonoCard from './TelefonoCard.jsx';
import { getFeaturedPhones } from '../data/phones.js';
import './SeccionDestacados.css';

const SeccionDestacados = () => {
  const destacados = getFeaturedPhones();

  return (
    <section className="destacados">
      <div className="container">
        <div className="destacados__header">
          <div>
            <h2 className="destacados__titulo">Productos destacados</h2>
            <p className="destacados__subtitulo">
              Los favoritos de nuestros clientes
            </p>
          </div>
          <Link to="/catalogo" className="destacados__ver-todo">
            Ver todos →
          </Link>
        </div>

        <div className="destacados__grid">
          {destacados.map((telefono) => (
            <TelefonoCard key={telefono.id} telefono={telefono} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionDestacados;
