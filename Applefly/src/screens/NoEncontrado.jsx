import { Link } from 'react-router-dom';
import Boton from '../components/Boton.jsx';
import './NoEncontrado.css';

const NoEncontrado = () => {
  return (
    <div className="no-encontrado page-enter">
      <div className="container">
        <div className="no-encontrado__contenido">
          <h1>404</h1>
          <h2>Página no encontrada</h2>
          <p>
            Parece que la página que buscas no existe o fue movida.
            Vuelve al inicio o explora nuestro catálogo.
          </p>
          <div className="no-encontrado__acciones">
            <Link to="/">
              <Boton texto="Ir al inicio" variante="primary" tamano="lg" />
            </Link>
            <Link to="/catalogo">
              <Boton texto="Ver catálogo" variante="outline" tamano="lg" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoEncontrado;
