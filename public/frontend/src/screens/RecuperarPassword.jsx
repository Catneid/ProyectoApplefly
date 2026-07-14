import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useRecuperarPassword } from '../hooks/useRecuperarPassword.js';
import Boton from '../components/Boton.jsx';
import './Auth.css';

/**
 * Recuperación de contraseña en tres pasos (criterio 10 de la rúbrica):
 * pedir el código al correo, verificarlo, y escribir la nueva contraseña.
 * El backend recuerda en qué paso va con una cookie firmada de 15 minutos.
 */
const RecuperarPassword = () => {
  const { paso, email, enviando, solicitarCodigo, verificarCodigo, guardarNuevaPassword } =
    useRecuperarPassword();
  const navigate = useNavigate();

  const formCorreo = useForm();
  const formCodigo = useForm();
  const formPassword = useForm();

  const pedirCodigo = async ({ correo }) => {
    try {
      toast.success(await solicitarCodigo(correo));
    } catch (e) {
      formCorreo.setError('correo', { message: e.message });
      toast.error(e.message);
    }
  };

  const comprobarCodigo = async ({ codigo }) => {
    try {
      toast.success(await verificarCodigo(codigo.trim()));
    } catch (e) {
      formCodigo.setError('codigo', { message: e.message });
      toast.error(e.message);
    }
  };

  const cambiarPassword = async ({ password, confirmar }) => {
    try {
      await guardarNuevaPassword(password, confirmar);
      toast.success('Contraseña actualizada, ya puedes iniciar sesión');
      navigate('/login');
    } catch (e) {
      formPassword.setError('password', { message: e.message });
      toast.error(e.message);
    }
  };

  return (
    <div className="auth page-enter">
      <div className="auth__container">
        <div className="auth__card">

          {paso === 1 && (
            <>
              <h1>Recuperar contraseña</h1>
              <p className="auth__subtitulo">
                Escribe tu correo y te enviaremos un código para restablecerla.
              </p>

              <form onSubmit={formCorreo.handleSubmit(pedirCodigo)} className="auth__form" noValidate>
                <div className="auth__field">
                  <label className="auth__label">Correo electrónico</label>
                  <input
                    type="email"
                    className={`auth__input ${formCorreo.formState.errors.correo ? 'auth__input--error' : ''}`}
                    placeholder="tu@email.com"
                    {...formCorreo.register('correo', {
                      required: 'El correo es requerido',
                      pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' },
                    })}
                  />
                  {formCorreo.formState.errors.correo && (
                    <span className="auth__error-msg">{formCorreo.formState.errors.correo.message}</span>
                  )}
                </div>

                <Boton
                  texto={enviando ? 'Enviando...' : 'Enviarme el código'}
                  tipo="submit"
                  variante="primary"
                  tamano="full"
                  disabled={enviando}
                />
              </form>
            </>
          )}

          {paso === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📧</div>
                <h1>Revisa tu correo</h1>
                <p className="auth__subtitulo">
                  Enviamos un código de 6 caracteres a <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={formCodigo.handleSubmit(comprobarCodigo)} className="auth__form" noValidate>
                <div className="auth__field">
                  <label className="auth__label" style={{ textAlign: 'center' }}>Código</label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className={`auth__input ${formCodigo.formState.errors.codigo ? 'auth__input--error' : ''}`}
                    placeholder="abc123"
                    style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, letterSpacing: 8 }}
                    {...formCodigo.register('codigo', {
                      required: 'Escribe el código que te enviamos',
                      minLength: { value: 6, message: 'El código tiene 6 caracteres' },
                    })}
                  />
                  {formCodigo.formState.errors.codigo && (
                    <span className="auth__error-msg" style={{ textAlign: 'center' }}>
                      {formCodigo.formState.errors.codigo.message}
                    </span>
                  )}
                </div>

                <Boton
                  texto={enviando ? 'Verificando...' : 'Verificar código'}
                  tipo="submit"
                  variante="primary"
                  tamano="full"
                  disabled={enviando}
                />
              </form>

              <p className="auth__alt">El código expira en 15 minutos. Revisa tu carpeta de spam.</p>
            </>
          )}

          {paso === 3 && (
            <>
              <h1>Nueva contraseña</h1>
              <p className="auth__subtitulo">Elige una contraseña nueva para tu cuenta.</p>

              <form onSubmit={formPassword.handleSubmit(cambiarPassword)} className="auth__form" noValidate>
                <div className="auth__field">
                  <label className="auth__label">Nueva contraseña</label>
                  <input
                    type="password"
                    className={`auth__input ${formPassword.formState.errors.password ? 'auth__input--error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    {...formPassword.register('password', {
                      required: 'La contraseña es requerida',
                      minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                    })}
                  />
                  {formPassword.formState.errors.password && (
                    <span className="auth__error-msg">{formPassword.formState.errors.password.message}</span>
                  )}
                </div>

                <div className="auth__field">
                  <label className="auth__label">Confirmar contraseña</label>
                  <input
                    type="password"
                    className={`auth__input ${formPassword.formState.errors.confirmar ? 'auth__input--error' : ''}`}
                    placeholder="Repite la contraseña"
                    {...formPassword.register('confirmar', {
                      required: 'Confirma tu contraseña',
                      validate: (v) =>
                        v === formPassword.watch('password') || 'Las contraseñas no coinciden',
                    })}
                  />
                  {formPassword.formState.errors.confirmar && (
                    <span className="auth__error-msg">{formPassword.formState.errors.confirmar.message}</span>
                  )}
                </div>

                <Boton
                  texto={enviando ? 'Guardando...' : 'Guardar contraseña'}
                  tipo="submit"
                  variante="primary"
                  tamano="full"
                  disabled={enviando}
                />
              </form>
            </>
          )}

          <p className="auth__alt">
            <Link to="/login">← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
