import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const resultado = await login(data);
    if (resultado.ok) {
      navigate('/');
    } else {
      setError('root', { message: resultado.message });
    }
  };

  return (
    <div className="auth page-enter">
      <div className="auth__container">
        <div className="auth__card">
          <h1>Iniciar sesión</h1>
          <p className="auth__subtitulo">Bienvenido de nuevo a Applefly</p>

          <form onSubmit={handleSubmit(onSubmit)} className="auth__form" noValidate>
            <div className="auth__field">
              <label className="auth__label">Correo electrónico</label>
              <input
                type="email"
                className={`auth__input ${errors.email ? 'auth__input--error' : ''}`}
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El correo es requerido',
                  pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' },
                })}
              />
              {errors.email && <span className="auth__error-msg">{errors.email.message}</span>}
            </div>

            <div className="auth__field">
              <label className="auth__label">Contraseña</label>
              <input
                type="password"
                className={`auth__input ${errors.password ? 'auth__input--error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              {errors.password && <span className="auth__error-msg">{errors.password.message}</span>}
            </div>

            {errors.root && <div className="auth__error">{errors.root.message}</div>}

            <Boton
              texto={isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              tipo="submit"
              variante="primary"
              tamano="full"
              disabled={isSubmitting}
            />
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
