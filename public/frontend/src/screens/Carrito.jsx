import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Boton from '../components/Boton.jsx';
import './Carrito.css';

const Carrito = () => {
  const { items, removeFromCart, updateQuantity, subtotal, shipping, tax, total, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // El carrito ya no compra nada: solo lleva al checkout, que es donde se
  // piden los datos de envío, se cobra la tarjeta y se confirma el pedido.
  const irAlCheckout = () => {
    if (!user) {
      toast('Inicia sesión para completar tu compra', { icon: '🔒' });
      navigate('/login', { state: { desde: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const vaciarCarrito = () => {
    clearCart();
    toast.success('Carrito vaciado');
  };

  if (items.length === 0) {
    return (
      <div className="carrito-vacio page-enter">
        <div className="container">
          <div className="carrito-vacio__contenido">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2>Tu carrito está vacío</h2>
            <p>Aún no has agregado ningún teléfono. Explora nuestro catálogo.</p>
            <Link to="/catalogo">
              <Boton texto="Ir al catálogo" variante="primary" tamano="lg" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="carrito page-enter">
      <div className="container">
        <h1 className="carrito__titulo">Carrito de compras</h1>
        <p className="carrito__subtitulo">
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
        </p>

        <div className="carrito__grid">
          <div className="carrito__items">
            {items.map((item) => (
              <article key={item.id} className="carrito-item">
                <Link to={`/producto/${item.id}`}>
                  <img src={item.image} alt={item.name} className="carrito-item__imagen" />
                </Link>
                <div className="carrito-item__info">
                  <span className="carrito-item__marca">{item.category}</span>
                  <h3><Link to={`/producto/${item.id}`}>{item.name}</Link></h3>
                  <p className="carrito-item__specs">
                    {item.storage} · {item.ram} RAM · {item.color}
                  </p>
                  <p className="carrito-item__condicion">{item.condition}</p>
                </div>

                <div className="carrito-item__cantidad">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Disminuir">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Aumentar">+</button>
                </div>

                <div className="carrito-item__precio">
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  {item.quantity > 1 && <small>${item.price} c/u</small>}
                </div>

                <button className="carrito-item__eliminar" onClick={() => removeFromCart(item.id)} aria-label="Eliminar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </article>
            ))}

            <div className="carrito__acciones-lista">
              <Link to="/catalogo">
                <Boton texto="← Seguir comprando" variante="ghost" />
              </Link>
              <Boton texto="Vaciar carrito" variante="ghost" onClick={vaciarCarrito} />
            </div>
          </div>

          <aside className="carrito__resumen">
            <h3>Resumen del pedido</h3>
            <div className="carrito__linea">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="carrito__linea">
              <span>Envío</span><span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="carrito__linea">
              <span>IVA (13%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="carrito__linea carrito__linea--total">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>

            {subtotal < 500 && (
              <p className="carrito__aviso">
                Agrega ${(500 - subtotal).toFixed(2)} más y obtén envío gratis.
              </p>
            )}

            <Boton
              texto={user ? 'Continuar con la compra' : 'Iniciar sesión para comprar'}
              variante="primary"
              tamano="full"
              onClick={irAlCheckout}
            />

            <div className="carrito__pago-info">
              <p>Pagos seguros con Wompi · Garantía de 12 meses</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
