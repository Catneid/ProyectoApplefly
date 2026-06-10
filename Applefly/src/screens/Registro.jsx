import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import FormInput from '../components/FormInput.jsx';
import './Auth.css';

const Registro = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    setError(null);
    if (datos.password !== datos.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    const resultado = register(datos);
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
          <h1>Crear cuenta</h1>
          <p className="auth__subtitulo">
            Únete a Applefly y obtén ofertas exclusivas
          </p>

          <form onSubmit={manejarEnvio} className="auth__form">
            <FormInput
              label="Nombre completo"
              name="name"
              valor={datos.name}
              onChange={manejarCambio}
              placeholder="Tu nombre"
              requerido
            />
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
            <FormInput
              label="Confirmar contraseña"
              name="confirmPassword"
              tipo="password"
              valor={datos.confirmPassword}
              onChange={manejarCambio}
              placeholder="Repite tu contraseña"
              requerido
            />

            {error && <div className="auth__error">{error}</div>}

            <label className="auth__terminos">
              <input type="checkbox" required />
              <span>
                Acepto los <a href="#">términos y condiciones</a> de Applefly
              </span>
            </label>

            <Boton texto="Crear cuenta" tipo="submit" variante="primary" tamano="full" />
          </form>

          <p className="auth__alt">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
