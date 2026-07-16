import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePerfil } from '../hooks/usePerfil.js';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import './Perfil.css';

const Perfil = () => {
  const { perfil, cargando, error, actualizarPerfil, cambiarPassword } = usePerfil();
  const { logout } = useAuth();

  const [modalPassword, setModalPassword] = useState(false);

  const formDatos = useForm();
  const formPassword = useForm();

  const abrirModalPassword = () => {
    formPassword.reset();
    setModalPassword(true);
  };

  const cerrarModalPassword = () => {
    formPassword.reset();
    setModalPassword(false);
  };

  // El perfil llega del servidor después del primer render, así que hay que
  // volcar sus valores al formulario cuando aparece.
  useEffect(() => {
    if (perfil) {
      formDatos.reset({
        name: perfil.name || '',
        lastName: perfil.lastName || '',
        phone: perfil.phone || '',
        address: perfil.address || '',
        birthdate: perfil.birthdate ? perfil.birthdate.substring(0, 10) : '',
      });
    }
  }, [perfil, formDatos]);

  const guardarDatos = async (datos) => {
    try {
      await actualizarPerfil(datos);
      toast.success('Perfil actualizado');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const guardarPassword = async (datos) => {
    try {
      await cambiarPassword(datos.currentPassword, datos.newPassword);
      formPassword.reset();
      setModalPassword(false);
      toast.success('Contraseña actualizada');
    } catch (e) {
      formPassword.setError('currentPassword', { message: e.message });
      toast.error(e.message);
    }
  };

  if (cargando) {
    return (
      <div className="perfil page-enter">
        <div className="container"><p className="perfil__cargando">Cargando tu perfil...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil page-enter">
        <div className="container"><p className="perfil__error">{error}</p></div>
      </div>
    );
  }

  return (
    <div className="perfil page-enter">
      <div className="container">
        <header className="perfil__header">
          <div className="perfil__avatar">{perfil.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{perfil.name} {perfil.lastName}</h1>
            <p className="perfil__email">{perfil.email}</p>
          </div>
        </header>

        <div className="perfil__grid">
          <section className="perfil__card">
            <h2>Mis datos</h2>

            <form onSubmit={formDatos.handleSubmit(guardarDatos)} className="perfil__form" noValidate>
              <div className="perfil__row">
                <div className="perfil__field">
                  <label>Nombre</label>
                  <input {...formDatos.register('name', { required: 'El nombre es requerido' })} />
                  {formDatos.formState.errors.name && (
                    <span className="perfil__error-msg">{formDatos.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="perfil__field">
                  <label>Apellido</label>
                  <input {...formDatos.register('lastName')} />
                </div>
              </div>

              <div className="perfil__field">
                <label>Correo electrónico</label>
                {/* El correo identifica la cuenta, por eso no se puede editar */}
                <input value={perfil.email} disabled />
                <small>El correo no se puede cambiar</small>
              </div>

              <div className="perfil__row">
                <div className="perfil__field">
                  <label>Teléfono</label>
                  <input
                    placeholder="7777-7777"
                    {...formDatos.register('phone', {
                      pattern: { value: /^[0-9]{4}-?[0-9]{4}$/, message: 'Formato: 7777-7777' },
                    })}
                  />
                  {formDatos.formState.errors.phone && (
                    <span className="perfil__error-msg">{formDatos.formState.errors.phone.message}</span>
                  )}
                </div>
                <div className="perfil__field">
                  <label>Fecha de nacimiento</label>
                  <input type="date" {...formDatos.register('birthdate')} />
                </div>
              </div>

              <div className="perfil__field">
                <label>Dirección</label>
                <input placeholder="Tu dirección de envío" {...formDatos.register('address')} />
              </div>

              <Boton
                texto={formDatos.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                tipo="submit"
                variante="primary"
                deshabilitado={formDatos.formState.isSubmitting}
              />
            </form>
          </section>

          <section className="perfil__card">
            <h2>Seguridad</h2>
            <p className="perfil__hint">
              Actualiza tu contraseña de acceso cuando lo necesites.
            </p>
            <Boton
              texto="Cambiar Contraseña"
              variante="secondary"
              onClick={abrirModalPassword}
            />
          </section>
        </div>

        <div className="perfil__acciones">
          <Link to="/mis-pedidos">
            <Boton texto="Ver mis pedidos" variante="ghost" />
          </Link>
          <Boton texto="Cerrar Sesión" variante="ghost" onClick={logout} />
        </div>
      </div>

      {modalPassword && (
        <div className="perfil__modal-overlay" onClick={cerrarModalPassword}>
          <div
            className="perfil__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cambiar contraseña"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="perfil__modal-header">
              <h2>Cambiar Contraseña</h2>
              <button
                type="button"
                className="perfil__modal-close"
                onClick={cerrarModalPassword}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={formPassword.handleSubmit(guardarPassword)} className="perfil__form" noValidate>
              <div className="perfil__field">
                <label>Contraseña actual</label>
                <input
                  type="password"
                  {...formPassword.register('currentPassword', { required: 'Requerida' })}
                />
                {formPassword.formState.errors.currentPassword && (
                  <span className="perfil__error-msg">{formPassword.formState.errors.currentPassword.message}</span>
                )}
              </div>

              <div className="perfil__field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...formPassword.register('newPassword', {
                    required: 'Requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  })}
                />
                {formPassword.formState.errors.newPassword && (
                  <span className="perfil__error-msg">{formPassword.formState.errors.newPassword.message}</span>
                )}
              </div>

              <div className="perfil__field">
                <label>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  {...formPassword.register('confirmar', {
                    required: 'Confirma la contraseña',
                    validate: (v) =>
                      v === formPassword.watch('newPassword') || 'Las contraseñas no coinciden',
                  })}
                />
                {formPassword.formState.errors.confirmar && (
                  <span className="perfil__error-msg">{formPassword.formState.errors.confirmar.message}</span>
                )}
              </div>

              <p className="perfil__modal-olvido">
                <Link to="/recuperar-password" onClick={cerrarModalPassword}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>

              <div className="perfil__modal-acciones">
                <Boton
                  texto="Cancelar"
                  tipo="button"
                  variante="ghost"
                  onClick={cerrarModalPassword}
                />
                <Boton
                  texto={formPassword.formState.isSubmitting ? 'Cambiando...' : 'Guardar contraseña'}
                  tipo="submit"
                  variante="primary"
                  deshabilitado={formPassword.formState.isSubmitting}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
