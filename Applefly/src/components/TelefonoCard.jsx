import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import Boton from './Boton.jsx';
import './TelefonoCard.css';

/**
 * Tarjeta de producto (teléfono).
 * Muestra imagen, marca, nombre, condición, precio y botón de añadir al carrito.
 */
const TelefonoCard = ({ telefono }) => {
  const { addToCart } = useCart();

  const descuento = telefono.originalPrice
    ? Math.round(((telefono.originalPrice - telefono.price) / telefono.originalPrice) * 100)
    : 0;

  const agregarAlCarrito = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(telefono);
  };

  return (
    <article className="telefono-card">
      <Link to={`/producto/${telefono.id}`} className="telefono-card__link">
        <div className="telefono-card__imagen-wrapper">
          {descuento > 0 && (
            <span className="telefono-card__descuento">-{descuento}%</span>
          )}
          <span className="telefono-card__condicion">{telefono.condition}</span>
          <img
            src={telefono.image}
            alt={telefono.name}
            className="telefono-card__imagen"
            loading="lazy"
          />
        </div>

        <div className="telefono-card__info">
          <span className="telefono-card__marca">{telefono.category}</span>
          <h3 className="telefono-card__nombre">{telefono.name}</h3>

          <div className="telefono-card__specs">
            <span>{telefono.storage}</span>
            <span>•</span>
            <span>{telefono.ram} RAM</span>
          </div>

          <div className="telefono-card__rating">
            <span className="telefono-card__estrellas">
              {'★'.repeat(Math.floor(telefono.rating))}
              {'☆'.repeat(5 - Math.floor(telefono.rating))}
            </span>
            <span className="telefono-card__reviews">({telefono.reviews})</span>
          </div>

          <div className="telefono-card__precios">
            <span className="telefono-card__precio">${telefono.price}</span>
            {telefono.originalPrice && (
              <span className="telefono-card__precio-original">
                ${telefono.originalPrice}
              </span>
            )}
          </div>

          <Boton
            texto="Agregar al carrito"
            variante="primary"
            tamano="full"
            onClick={agregarAlCarrito}
          />
        </div>
      </Link>
    </article>
  );
};

export default TelefonoCard;
