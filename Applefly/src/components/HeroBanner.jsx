import { Link } from 'react-router-dom';
import Boton from './Boton.jsx';
import logo from '../assets/logo.png';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__contenido">
          <span className="hero__etiqueta">Apple reacondicionado · Garantía 12 meses</span>
          <h1 className="hero__titulo">
            Premium.<br />
            <span className="hero__accent">Reacondicionado.</span><br />
            Como nuevo.
          </h1>
          <p className="hero__descripcion">
            Dispositivos Apple certificados a un precio más accesible. iPhone,
            iPad, MacBook, Apple Watch y AirPods — todos con garantía y envío
            a todo El Salvador.
          </p>
          <div className="hero__acciones">
            <Link to="/catalogo">
              <Boton texto="Ver catálogo" tamano="lg" variante="primary" />
            </Link>
            <Link to="/nosotros">
              <Boton texto="Conoce más" tamano="lg" variante="outline" />
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <strong>12 meses</strong>
              <span>de garantía</span>
            </div>
            <div className="hero__stat">
              <strong>+5,000</strong>
              <span>clientes felices</span>
            </div>
            <div className="hero__stat">
              <strong>98%</strong>
              <span>satisfacción</span>
            </div>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__card">
            <img src={logo} alt="" className="hero__logo" />
            <span className="hero__card-badge">100% Apple</span>
          </div>
          <div className="hero__orbe hero__orbe--1"></div>
          <div className="hero__orbe hero__orbe--2"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
