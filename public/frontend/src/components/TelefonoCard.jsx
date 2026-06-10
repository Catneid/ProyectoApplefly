import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import Boton from './Boton.jsx';
import './TelefonoCard.css';

const TelefonoCard = ({ telefono }) => {
  const { addToCart } = useCart();

  const idProducto = telefono.id || telefono._id;

  const descuento = telefono.discount > 0
    ? telefono.discount
    : telefono.originalPrice
      ? Math.round(((telefono.originalPrice - telefono.price) / telefono.originalPrice) * 100)
      : 0;

  const agregarAlCarrito = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...telefono, id: idProducto });
  };

  return (
    <article className="telefono-card">
      <Link to={`/producto/${idProducto}`} className="telefono-card__link">
        <div className="telefono-card__imagen-wrapper">
          {descuento > 0 && (
            <span className="telefono-card__descuento">-{descuento}%</span>
          )}
          <span className="telefono-card__condicion">{telefono.condition || 'Nuevo'}</span>
          {telefono.image ? (
            <img
              src={telefono.image}
              alt={telefono.name}
              className="telefono-card__imagen"
              loading="lazy"
            />
          ) : (
            <div className="telefono-card__imagen telefono-card__imagen--placeholder">
              📦
            </div>
          )}
        </div>

        <div className="telefono-card__info">
          <span className="telefono-card__marca">{telefono.category}</span>
          <h3 className="telefono-card__nombre">{telefono.name}</h3>

          {(telefono.storage || telefono.ram) && (
            <div className="telefono-card__specs">
              {telefono.storage && <span>{telefono.storage}</span>}
              {telefono.storage && telefono.ram && <span>•</span>}
              {telefono.ram && <span>{telefono.ram} RAM</span>}
            </div>
          )}

          {telefono.rating > 0 && (
            <div className="telefono-card__rating">
              <span className="telefono-card__estrellas">
                {'★'.repeat(Math.min(5, Math.floor(telefono.rating)))}
                {'☆'.repeat(Math.max(0, 5 - Math.floor(telefono.rating)))}
              </span>
              {telefono.reviews > 0 && (
                <span className="telefono-card__reviews">({telefono.reviews})</span>
              )}
            </div>
          )}

          <div className="telefono-card__precios">
            <span className="telefono-card__precio">${telefono.price?.toFixed(2)}</span>
            {telefono.originalPrice && (
              <span className="telefono-card__precio-original">
                ${telefono.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          <Boton
            texto="Agregar al carrito"
            variante="primary"
            tamano="full"
            onClick={agregarAlCarrito}
            deshabilitado={(telefono.stock || 0) === 0}
          />
        </div>
      </Link>
    </article>
  );
};

export default TelefonoCard;
