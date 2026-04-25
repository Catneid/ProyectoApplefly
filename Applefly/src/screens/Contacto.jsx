import { useState } from 'react';
import Boton from '../components/Boton.jsx';
import FormInput from '../components/FormInput.jsx';
import './Contacto.css';

const Contacto = () => {
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: '',
  });
  const [enviado, setEnviado] = useState(false);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    // Simulación de envío
    setEnviado(true);
    setTimeout(() => {
      setEnviado(false);
      setDatos({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
    }, 3500);
  };

  return (
    <div className="contacto page-enter">
      <div className="container">
        <div className="contacto__header">
          <h1>Contáctanos</h1>
          <p>Estamos aquí para resolver tus dudas. Escríbenos y te responderemos lo antes posible.</p>
        </div>

        <div className="contacto__grid">
          <aside className="contacto__info">
            <h3>Información de contacto</h3>
            <ul>
              <li>
                <div className="contacto__icono-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <strong>Dirección</strong>
                  <span>Avenida Principal #123, San Salvador, El Salvador</span>
                </div>
              </li>
              <li>
                <div className="contacto__icono-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <strong>Teléfono</strong>
                  <span>+503 2222-3333</span>
                </div>
              </li>
              <li>
                <div className="contacto__icono-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <strong>Correo electrónico</strong>
                  <span>info@applefly.com</span>
                </div>
              </li>
              <li>
                <div className="contacto__icono-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <strong>Horario</strong>
                  <span>Lun - Vie: 8:00am - 6:00pm<br/>Sáb: 9:00am - 2:00pm</span>
                </div>
              </li>
            </ul>
          </aside>

          <form className="contacto__form" onSubmit={manejarEnvio}>
            <h3>Envíanos un mensaje</h3>

            {enviado && (
              <div className="contacto__exito">
                ✓ ¡Mensaje enviado con éxito! Te responderemos pronto.
              </div>
            )}

            <div className="contacto__fila">
              <FormInput
                label="Nombre completo"
                name="nombre"
                valor={datos.nombre}
                onChange={manejarCambio}
                requerido
              />
              <FormInput
                label="Correo electrónico"
                name="email"
                tipo="email"
                valor={datos.email}
                onChange={manejarCambio}
                requerido
              />
            </div>
            <div className="contacto__fila">
              <FormInput
                label="Teléfono"
                name="telefono"
                tipo="tel"
                valor={datos.telefono}
                onChange={manejarCambio}
              />
              <FormInput
                label="Asunto"
                name="asunto"
                valor={datos.asunto}
                onChange={manejarCambio}
                requerido
              />
            </div>
            <FormInput
              label="Mensaje"
              name="mensaje"
              valor={datos.mensaje}
              onChange={manejarCambio}
              placeholder="Cuéntanos cómo podemos ayudarte..."
              requerido
              esTextarea
              filas={5}
            />

            <Boton texto="Enviar mensaje" tipo="submit" variante="primary" tamano="full" />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
