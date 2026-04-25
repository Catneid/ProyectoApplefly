import { Link } from 'react-router-dom';
import Boton from '../components/Boton.jsx';
import './Nosotros.css';

const Nosotros = () => {
  return (
    <div className="nosotros page-enter">
      <section className="nosotros__hero">
        <div className="container">
          <span className="nosotros__etiqueta">Nuestra historia</span>
          <h1>Aliviando tu bolsillo, cuidando el planeta</h1>
          <p>
            En Applefly creemos que todos merecen acceso a tecnología de calidad,
            a precios justos y con responsabilidad ambiental.
          </p>
        </div>
      </section>

      <section className="nosotros__mision">
        <div className="container nosotros__mision-grid">
          <div className="nosotros__card">
            <div className="nosotros__icono">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3>Misión</h3>
            <p>
              Ofrecer dispositivos Apple reacondicionados de alta calidad con garantía,
              democratizando el acceso a la tecnología premium.
            </p>
          </div>
          <div className="nosotros__card">
            <div className="nosotros__icono">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <h3>Visión</h3>
            <p>
              Ser el líder regional en venta de dispositivos Apple reacondicionados,
              promoviendo el consumo consciente y la economía circular.
            </p>
          </div>
          <div className="nosotros__card">
            <div className="nosotros__icono">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>Valores</h3>
            <p>
              Transparencia, calidad, responsabilidad ambiental y servicio
              excepcional al cliente.
            </p>
          </div>
        </div>
      </section>

      <section className="nosotros__proceso">
        <div className="container">
          <h2>Nuestro proceso de reacondicionamiento</h2>
          <p className="nosotros__proceso-intro">
            Cada equipo pasa por un riguroso proceso de 5 etapas antes de llegar a ti.
          </p>
          <ol className="nosotros__pasos">
            <li><strong>Inspección inicial</strong><span>Diagnóstico completo del hardware y software.</span></li>
            <li><strong>Reparación y reemplazo</strong><span>Cambio de piezas dañadas por repuestos originales.</span></li>
            <li><strong>Limpieza profunda</strong><span>Higienización y pulido profesional del dispositivo.</span></li>
            <li><strong>Pruebas de calidad</strong><span>Más de 30 pruebas de funcionamiento y rendimiento.</span></li>
            <li><strong>Certificación y garantía</strong><span>Sello de calidad y garantía de 12 meses.</span></li>
          </ol>
        </div>
      </section>

      <section className="nosotros__equipo">
        <div className="container">
          <h2>Nuestro equipo</h2>
          <p className="nosotros__equipo-intro">
            Somos un grupo de jóvenes apasionados por la tecnología y el emprendimiento.
          </p>
          <div className="nosotros__miembros">
            {[
              { nombre: 'Gabriel Ramirez', iniciales: 'GR' },
              { nombre: 'Carlos Salinas', iniciales: 'CS' },
              { nombre: 'David Iglesias', iniciales: 'DI' },
              { nombre: 'Isaac Ramos', iniciales: 'IR' },
            ].map((m) => (
              <div key={m.nombre} className="nosotros__miembro">
                <div className="nosotros__avatar">{m.iniciales}</div>
                <h4>{m.nombre}</h4>
                <span>Desarrollo de Software</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nosotros__cta">
        <div className="container">
          <h2>¿Listo para encontrar tu próximo Apple?</h2>
          <p>Explora nuestro catálogo y encuentra la mejor opción para ti.</p>
          <Link to="/catalogo">
            <Boton texto="Ver catálogo" variante="primary" tamano="lg" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;
