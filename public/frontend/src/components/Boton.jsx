import './Boton.css';

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
