import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Envuelve las pantallas que exigen sesión iniciada (checkout, perfil,
 * mis pedidos). Si no hay usuario, manda al login guardando de dónde venía,
 * para devolverlo ahí después de entrar en vez de tirarlo al inicio.
 *
 * Esto es solo la mitad visual de la protección. La que de verdad importa
 * la hace el backend con verifyToken: esconder la ruta en el navegador no
 * detendría a nadie que llame la API directamente.
 */
const RutaProtegida = ({ children }) => {
  const { user, cargando } = useAuth();
  const location = useLocation();

  // Todavía estamos preguntándole al backend si la sesión sigue viva.
  // Redirigir ahora echaría al login a un usuario que sí está dentro.
  if (cargando) {
    return (
      <div className="cargando-pantalla">
        <div className="cargando-pantalla__spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  }

  return children;
};

export default RutaProtegida;
