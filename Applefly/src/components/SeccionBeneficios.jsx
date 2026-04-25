import './SeccionBeneficios.css';

const beneficios = [
  {
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    titulo: '12 meses de garantía',
    descripcion: 'Todos los dispositivos incluyen garantía total contra defectos.',
  },
  {
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    titulo: 'Envío gratis',
    descripcion: 'Envío sin costo para compras mayores a $500 a todo El Salvador.',
  },
  {
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    titulo: 'Certificación técnica',
    descripcion: 'Cada equipo pasa por 30+ pruebas de calidad antes de venderse.',
  },
  {
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    titulo: '30 días de devolución',
    descripcion: 'Si no quedas satisfecho, te devolvemos tu dinero sin preguntas.',
  },
];

const SeccionBeneficios = () => {
  return (
    <section className="beneficios">
      <div className="container">
        <div className="beneficios__grid">
          {beneficios.map((b, i) => (
            <div key={i} className="beneficios__item">
              <div className="beneficios__icono">{b.icono}</div>
              <h3>{b.titulo}</h3>
              <p>{b.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionBeneficios;
