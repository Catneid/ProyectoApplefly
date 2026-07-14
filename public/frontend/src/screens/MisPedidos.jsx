import { Link } from 'react-router-dom';
import { usePedidos } from '../hooks/usePedidos.js';
import Boton from '../components/Boton.jsx';
import './MisPedidos.css';

// Cada estado del pedido tiene su color, para que se lea de un vistazo
// en qué punto va la entrega.
const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'pendiente' },
  procesando: { texto: 'En preparación', clase: 'procesando' },
  enviado: { texto: 'Enviado', clase: 'enviado' },
  entregado: { texto: 'Entregado', clase: 'entregado' },
  cancelado: { texto: 'Cancelado', clase: 'cancelado' },
};

const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const MisPedidos = () => {
  const { pedidos, cargando, error } = usePedidos();

  if (cargando) {
    return (
      <div className="mis-pedidos page-enter">
        <div className="container">
          <div className="mis-pedidos__cargando">Cargando tus pedidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mis-pedidos page-enter">
        <div className="container">
          <div className="mis-pedidos__error">{error}</div>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="mis-pedidos page-enter">
        <div className="container">
          <div className="mis-pedidos__vacio">
            <div className="mis-pedidos__vacio-icono">📦</div>
            <h2>Todavía no tienes pedidos</h2>
            <p>Cuando compres algo, aquí podrás seguir su estado.</p>
            <Link to="/catalogo">
              <Boton texto="Explorar catálogo" variante="primary" tamano="lg" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-pedidos page-enter">
      <div className="container">
        <h1 className="mis-pedidos__titulo">Mis pedidos</h1>
        <p className="mis-pedidos__subtitulo">
          {pedidos.length} {pedidos.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
        </p>

        <div className="mis-pedidos__lista">
          {pedidos.map((pedido) => {
            const estado = ESTADOS[pedido.status] || ESTADOS.pendiente;

            return (
              <article key={pedido._id} className="pedido">
                <header className="pedido__header">
                  <div>
                    <span className="pedido__fecha">{formatearFecha(pedido.createdAt)}</span>
                    <span className="pedido__id">Pedido #{pedido._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <span className={`pedido__estado pedido__estado--${estado.clase}`}>
                    {estado.texto}
                  </span>
                </header>

                <div className="pedido__productos">
                  {pedido.products.map((producto, i) => (
                    <div key={i} className="pedido__producto">
                      <span className="pedido__producto-cantidad">{producto.quantity}×</span>
                      <span className="pedido__producto-nombre">{producto.name}</span>
                      <span className="pedido__producto-precio">${producto.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <footer className="pedido__footer">
                  <div className="pedido__envio">
                    <span>Enviar a: {pedido.address}</span>
                    {pedido.payment?.cardLast4 && (
                      <span>Pagado con •••• {pedido.payment.cardLast4}</span>
                    )}
                  </div>
                  <div className="pedido__total">
                    <span>Total</span>
                    <strong>${pedido.total?.toFixed(2)}</strong>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
