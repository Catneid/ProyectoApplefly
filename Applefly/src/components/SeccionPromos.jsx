import { Link } from 'react-router-dom';
import airpods from '../assets/airpods4.png';
import macpad from '../assets/macpad.png';
import './SeccionPromos.css';

const SeccionPromos = () => {
  return (
    <section className="promos">
      <div className="container promos__grid">
        <Link
          to={`/catalogo?categoria=${encodeURIComponent('AirPods')}`}
          className="promos__card promos__card--airpods"
        >
          <div className="promos__contenido">
            <span className="promos__etiqueta">Nuevos · Reacondicionados</span>
            <h3>AirPods 4</h3>
            <p>Sonido inmersivo y cancelación activa de ruido, a un precio imposible.</p>
            <span className="promos__cta">Comprar ahora →</span>
          </div>
          <div className="promos__visual" aria-hidden="true">
            <img src={airpods} alt="" className="promos__visual-img" />
          </div>
        </Link>

        <Link
          to={`/catalogo?categoria=${encodeURIComponent('MacBook')}`}
          className="promos__card promos__card--office"
        >
          <div className="promos__contenido">
            <span className="promos__etiqueta">Home Office</span>
            <h3>Monta tu estación Apple</h3>
            <p>MacBook, iPad y Apple Watch reacondicionados — trabaja en todo lugar.</p>
            <span className="promos__cta">Ver catálogo →</span>
          </div>
          <div className="promos__visual" aria-hidden="true">
            <img src={macpad} alt="" className="promos__visual-img" />
          </div>
        </Link>
      </div>
    </section>
  );
};

export default SeccionPromos;
