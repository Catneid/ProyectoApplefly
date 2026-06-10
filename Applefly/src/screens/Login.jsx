import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import FormInput from '../components/FormInput.jsx';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    setError(null);
    const resultado = login(datos);
    if (resultado.ok) {
      navigate('/');
    } else {
      setError(resultado.message);
    }
  };

  return (
    <div className="auth page-enter">
      <div className="auth__container">
        <div className="auth__card">
          <h1>Iniciar sesión</h1>
          <p className="auth__subtitulo">Bienvenido de nuevo a Applefly</p>

          <form onSubmit={manejarEnvio} className="auth__form">
            <FormInput
              label="Correo electrónico"
              name="email"
              tipo="email"
              valor={datos.email}
              onChange={manejarCambio}
              placeholder="tu@email.com"
              requerido
            />
            <FormInput
              label="Contraseña"
              name="password"
              tipo="password"
              valor={datos.password}
              onChange={manejarCambio}
              placeholder="Mínimo 6 caracteres"
              requerido
            />

            {error && <div className="auth__error">{error}</div>}

            <div className="auth__extras">
              <label className="auth__recordar">
                <input type="checkbox" /> <span>Recordarme</span>
              </label>
              <a href="#" className="auth__olvido">¿Olvidaste tu contraseña?</a>
            </div>

            <Boton texto="Iniciar sesión" tipo="submit" variante="primary" tamano="full" />
          </form>

          <p className="auth__alt">
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
