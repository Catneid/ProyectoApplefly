import './Boton.css';

/**
 * Componente de botón reutilizable.
 * Soporta variantes: primary, secondary, outline, danger, ghost.
 * Soporta tamaños: sm, md, lg, full.
 */
const Boton = ({
  texto,
  children,
  clickHere,
  onClick,
  tipo = 'button',
  variante = 'primary',
  tamano = 'md',
  deshabilitado = false,
  icono = null,
  className = '',
}) => {
  const handleClick = onClick || clickHere;

  const classes = [
    'boton',
    `boton--${variante}`,
    `boton--${tamano}`,
    deshabilitado ? 'boton--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={tipo}
      className={classes}
      onClick={handleClick}
      disabled={deshabilitado}
    >
      {icono && <span className="boton__icono">{icono}</span>}
      {texto || children}
    </button>
  );
};

export default Boton;
