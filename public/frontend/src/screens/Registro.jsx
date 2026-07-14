import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import './Auth.css';

const Registro = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Las contraseñas no coinciden' });
      return;
    }

    try {
      await registerUser({
        name: data.name,
        lastName: data.lastName || '',
        birthdate: data.birthdate || null,
        email: data.email,
        password: data.password,
      });

      toast.success('Te enviamos un código a tu correo');
      navigate('/verificar-codigo', { state: { email: data.email } });
    } catch (e) {
      setError('root', { message: e.message });
      toast.error(e.message);
    }
  };

  return (
    <div className="auth page-enter">
      <div className="auth__container">
        <div className="auth__card">
          <h1>Crear cuenta</h1>
          <p className="auth__subtitulo">Únete a Applefly y obtén ofertas exclusivas</p>

          <form onSubmit={handleSubmit(onSubmit)} className="auth__form" noValidate>
            <div className="auth__row">
              <div className="auth__field">
                <label className="auth__label">Nombre *</label>
                <input
                  className={`auth__input ${errors.name ? 'auth__input--error' : ''}`}
                  placeholder="Tu nombre"
                  {...register('name', { required: 'Nombre requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.name && <span className="auth__error-msg">{errors.name.message}</span>}
              </div>
              <div className="auth__field">
                <label className="auth__label">Apellido</label>
                <input className="auth__input" placeholder="Tu apellido" {...register('lastName')} />
              </div>
            </div>

            <div className="auth__field">
              <label className="auth__label">Correo electrónico *</label>
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
              <label className="auth__label">Fecha de nacimiento</label>
              <input type="date" className="auth__input" {...register('birthdate')} />
            </div>

            <div className="auth__field">
              <label className="auth__label">Contraseña *</label>
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

            <div className="auth__field">
              <label className="auth__label">Confirmar contraseña *</label>
              <input
                type="password"
                className={`auth__input ${errors.confirmPassword ? 'auth__input--error' : ''}`}
                placeholder="Repite tu contraseña"
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (val) => val === password || 'Las contraseñas no coinciden',
                })}
              />
              {errors.confirmPassword && <span className="auth__error-msg">{errors.confirmPassword.message}</span>}
            </div>

            {errors.root && <div className="auth__error">{errors.root.message}</div>}

            <label className="auth__terminos">
              <input type="checkbox" required />
              <span>Acepto los <a href="#">términos y condiciones</a> de Applefly</span>
            </label>

            <Boton
              texto={isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              tipo="submit"
              variante="primary"
              tamano="full"
              disabled={isSubmitting}
            />
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
