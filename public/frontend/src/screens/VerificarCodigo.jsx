import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import './Auth.css';

const VerificarCodigo = () => {
  const { verifyCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (codigo.length < 6) {
      setError('Ingresa el código de 6 caracteres');
      return;
    }
    setLoading(true);
    setError(null);

    const resultado = await verifyCode(codigo.trim());
    setLoading(false);

    if (resultado.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(resultado.message);
    }
  };

  if (success) {
    return (
      <div className="auth page-enter">
        <div className="auth__container">
          <div className="auth__card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1>¡Cuenta verificada!</h1>
            <p className="auth__subtitulo">Tu cuenta ha sido creada exitosamente. Redirigiendo al login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth page-enter">
      <div className="auth__container">
        <div className="auth__card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📧</div>
            <h1>Verifica tu cuenta</h1>
            <p className="auth__subtitulo">
              Enviamos un código de 6 caracteres a{' '}
              {email ? <strong>{email}</strong> : 'tu correo'}
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="auth__form">
            <div className="auth__field">
              <label className="auth__label" style={{ textAlign: 'center' }}>Código de verificación</label>
              <input
                type="text"
                className={`auth__input ${error ? 'auth__input--error' : ''}`}
                placeholder="abc123"
                maxLength={6}
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value); setError(null); }}
                style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, letterSpacing: 8 }}
                autoFocus
              />
              {error && <span className="auth__error-msg" style={{ textAlign: 'center' }}>{error}</span>}
            </div>

            <Boton
              texto={loading ? 'Verificando...' : 'Verificar cuenta'}
              tipo="submit"
              variante="primary"
              tamano="full"
              disabled={loading || codigo.length < 6}
            />
          </form>

          <p className="auth__alt">
            ¿No recibiste el código? Revisa tu carpeta de spam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificarCodigo;
