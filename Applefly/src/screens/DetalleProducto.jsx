import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPhoneById, phones } from '../data/phones.js';
import { useCart } from '../context/CartContext.jsx';
import Boton from '../components/Boton.jsx';
import TelefonoCard from '../components/TelefonoCard.jsx';
import './DetalleProducto.css';

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const telefono = getPhoneById(id);
  const [cantidad, setCantidad] = useState(1);

  if (!telefono) {
    return (
      <div className="container detalle__no-encontrado page-enter">
        <h2>Producto no encontrado</h2>
        <p>El teléfono que buscas no existe en nuestro catálogo.</p>
        <Link to="/catalogo">
          <Boton texto="Volver al catálogo" variante="primary" />
        </Link>
      </div>
    );
  }

  const descuento = telefono.originalPrice
    ? Math.round(((telefono.originalPrice - telefono.price) / telefono.originalPrice) * 100)
    : 0;

  const relacionados = phones
    .filter((p) => p.category === telefono.category && p.id !== telefono.id)
    .slice(0, 4);

  const agregarAlCarrito = () => {
    addToCart(telefono, cantidad);
  };

  const comprarAhora = () => {
    addToCart(telefono, cantidad);
    navigate('/carrito');
  };

  return (
    <div className="detalle page-enter">
      <div className="container">
        <nav className="detalle__breadcrumb">
          <Link to="/">Inicio</Link>
          <span> / </span>
          <Link to="/catalogo">Catálogo</Link>
          <span> / </span>
          <Link to={`/catalogo?categoria=${encodeURIComponent(telefono.category)}`}>{telefono.category}</Link>
          <span> / </span>
          <span className="detalle__breadcrumb-actual">{telefono.name}</span>
        </nav>

        <div className="detalle__grid">
          <div className="detalle__imagen-wrapper">
            {descuento > 0 && (
              <span className="detalle__descuento">-{descuento}%</span>
            )}
            <img
              src={telefono.image}
              alt={telefono.name}
              className="detalle__imagen"
            />
          </div>

          <div className="detalle__info">
            <span className="detalle__marca">{telefono.category}</span>
            <h1 className="detalle__nombre">{telefono.name}</h1>

            <div className="detalle__rating">
              <span className="detalle__estrellas">
                {'★'.repeat(Math.floor(telefono.rating))}
                {'☆'.repeat(5 - Math.floor(telefono.rating))}
              </span>
              <span>{telefono.rating} ({telefono.reviews} reseñas)</span>
            </div>

            <div className="detalle__precios">
              <span className="detalle__precio">${telefono.price}</span>
              {telefono.originalPrice && (
                <span className="detalle__precio-original">${telefono.originalPrice}</span>
              )}
              {descuento > 0 && (
                <span className="detalle__ahorro">
                  Ahorras ${telefono.originalPrice - telefono.price}
                </span>
              )}
            </div>

            <p className="detalle__descripcion">{telefono.description}</p>

            <div className="detalle__atributos">
              <div className="detalle__atributo">
                <span className="detalle__atributo-label">Condición:</span>
                <span className="detalle__atributo-valor detalle__condicion">{telefono.condition}</span>
              </div>
              <div className="detalle__atributo">
                <span className="detalle__atributo-label">Almacenamiento:</span>
                <span className="detalle__atributo-valor">{telefono.storage}</span>
              </div>
              <div className="detalle__atributo">
                <span className="detalle__atributo-label">Memoria RAM:</span>
                <span className="detalle__atributo-valor">{telefono.ram}</span>
              </div>
              <div className="detalle__atributo">
                <span className="detalle__atributo-label">Color:</span>
                <span className="detalle__atributo-valor">{telefono.color}</span>
              </div>
              <div className="detalle__atributo">
                <span className="detalle__atributo-label">Disponibilidad:</span>
                <span className="detalle__atributo-valor detalle__stock">
                  {telefono.stock > 0 ? `${telefono.stock} disponibles` : 'Agotado'}
                </span>
              </div>
            </div>

            <div className="detalle__compra">
              <div className="detalle__cantidad">
                <label>Cantidad:</label>
                <div className="detalle__cantidad-control">
                  <button
                    type="button"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    aria-label="Disminuir"
                  >−</button>
                  <span>{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad(Math.min(telefono.stock, cantidad + 1))}
                    aria-label="Aumentar"
                  >+</button>
                </div>
              </div>
              <div className="detalle__acciones">
                <Boton
                  texto="Agregar al carrito"
                  variante="outline"
                  onClick={agregarAlCarrito}
                  deshabilitado={telefono.stock === 0}
                />
                <Boton
                  texto="Comprar ahora"
                  variante="primary"
                  onClick={comprarAhora}
                  deshabilitado={telefono.stock === 0}
                />
              </div>
            </div>

            <div className="detalle__beneficios">
              <div className="detalle__beneficio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>12 meses de garantía</span>
              </div>
              <div className="detalle__beneficio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Envío rápido</span>
              </div>
              <div className="detalle__beneficio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15A9 9 0 1 1 6 5.51L23 4"/></svg>
                <span>Devolución 30 días</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detalle__especificaciones">
          <h2>Especificaciones técnicas</h2>
          <div className="detalle__especs-grid">
            {Object.entries(telefono.specs).map(([clave, valor]) => (
              <div key={clave} className="detalle__espec">
                <span className="detalle__espec-label">
                  {clave.charAt(0).toUpperCase() + clave.slice(1)}
                </span>
                <span className="detalle__espec-valor">{valor}</span>
              </div>
            ))}
          </div>
        </div>

        {relacionados.length > 0 && (
          <div className="detalle__relacionados">
            <h2>Quizás te interese</h2>
            <div className="detalle__relacionados-grid">
              {relacionados.map((t) => (
                <TelefonoCard key={t.id} telefono={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleProducto;
