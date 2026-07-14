import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProductos } from '../context/ProductosContext.jsx';
import { usePedidos } from '../hooks/usePedidos.js';
import { useWompi } from '../hooks/useWompi.js';
import Boton from '../components/Boton.jsx';
import './Checkout.css';

// La compra se hace en tres pasos, no en un solo botón: primero a dónde se
// envía, luego con qué se paga, y al final una revisión antes de confirmar.
const PASOS = [
  { numero: 1, titulo: 'Envío' },
  { numero: 2, titulo: 'Pago' },
  { numero: 3, titulo: 'Revisión' },
];

// Tarjeta de prueba de Wompi. La cuenta está en modo test, así que no se
// cobra dinero real, pero la transacción sí viaja a la API de Wompi.
const TARJETA_DEMO = { numero: '4573 6900 0199 0693', cvv: '835', mes: '12', anio: '2029' };

const Checkout = () => {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const { refreshProductos } = useProductos();
  const { crearPedido } = usePedidos();
  const { pagar, procesando } = useWompi();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [envio, setEnvio] = useState(null);
  const [tarjeta, setTarjeta] = useState(null);
  const [pedidoListo, setPedidoListo] = useState(null);

  const formEnvio = useForm();
  const formPago = useForm();

  // Si el carrito quedó vacío (o lo vació en otra pestaña) no tiene sentido
  // seguir aquí. Solo lo dejamos pasar si ya terminó la compra.
  if (items.length === 0 && !pedidoListo) {
    return (
      <div className="checkout-vacio page-enter">
        <div className="container">
          <h2>No hay nada que comprar</h2>
          <p>Tu carrito está vacío.</p>
          <Link to="/catalogo"><Boton texto="Ir al catálogo" variante="primary" /></Link>
        </div>
      </div>
    );
  }

  const enviarPasoEnvio = (datos) => {
    setEnvio(datos);
    setPaso(2);
  };

  const enviarPasoPago = (datos) => {
    setTarjeta(datos);
    setPaso(3);
  };

  // El paso final: se cobra la tarjeta y, SOLO si el cobro fue aprobado,
  // se guarda el pedido. Si el pago falla no se crea ningún pedido, y si
  // el pedido falla el usuario se entera (no como antes, que decía
  // "compra exitosa" pasara lo que pasara).
  const confirmarCompra = async () => {
    try {
      const cobro = await pagar({
        monto: total,
        nombreCliente: `${envio.nombre} ${envio.apellido}`,
        emailCliente: user.email,
        tarjeta: { ...tarjeta, titular: `${envio.nombre} ${envio.apellido}` },
      });

      const pedido = await crearPedido({
        products: items.map((item) => ({
          productId: item._id || item.id,
          quantity: item.quantity,
        })),
        address: `${envio.direccion}, ${envio.ciudad}`,
        phone: envio.telefono,
        payment: {
          method: 'wompi',
          transactionId: cobro.idTransaccion,
          status: 'aprobado',
          cardLast4: cobro.cardLast4,
        },
      });

      setPedidoListo(pedido);
      clearCart();
      // El stock cambió en el servidor: recargamos el catálogo para que no
      // se quede mostrando existencias viejas.
      refreshProductos();
      toast.success('¡Pago aprobado! Tu pedido fue registrado');
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (pedidoListo) {
    return (
      <div className="checkout-exito page-enter">
        <div className="container">
          <div className="checkout-exito__card">
            <div className="checkout-exito__check">✓</div>
            <h1>¡Compra confirmada!</h1>
            <p>Gracias por tu compra, {user.name}. Te enviamos los detalles a <strong>{user.email}</strong>.</p>

            <dl className="checkout-exito__datos">
              <div><dt>Número de pedido</dt><dd>{pedidoListo._id}</dd></div>
              <div><dt>Total pagado</dt><dd>${pedidoListo.total.toFixed(2)}</dd></div>
              <div><dt>Tarjeta</dt><dd>•••• {pedidoListo.payment?.cardLast4}</dd></div>
              <div><dt>Estado</dt><dd className="checkout-exito__estado">{pedidoListo.status}</dd></div>
            </dl>

            <div className="checkout-exito__acciones">
              <Link to="/mis-pedidos"><Boton texto="Ver mis pedidos" variante="primary" /></Link>
              <Link to="/catalogo"><Boton texto="Seguir comprando" variante="ghost" /></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout page-enter">
      <div className="container">
        <h1 className="checkout__titulo">Finalizar compra</h1>

        <ol className="checkout__pasos">
          {PASOS.map((p) => (
            <li
              key={p.numero}
              className={`checkout__paso ${paso === p.numero ? 'checkout__paso--activo' : ''} ${paso > p.numero ? 'checkout__paso--hecho' : ''}`}
            >
              <span className="checkout__paso-numero">{paso > p.numero ? '✓' : p.numero}</span>
              <span className="checkout__paso-titulo">{p.titulo}</span>
            </li>
          ))}
        </ol>

        <div className="checkout__grid">
          <div className="checkout__contenido">

            {paso === 1 && (
              <form onSubmit={formEnvio.handleSubmit(enviarPasoEnvio)} className="checkout__form" noValidate>
                <h2>¿A dónde lo enviamos?</h2>

                <div className="checkout__row">
                  <div className="checkout__field">
                    <label>Nombre *</label>
                    <input
                      defaultValue={user.name}
                      {...formEnvio.register('nombre', { required: 'El nombre es requerido' })}
                    />
                    {formEnvio.formState.errors.nombre && <span className="checkout__error">{formEnvio.formState.errors.nombre.message}</span>}
                  </div>
                  <div className="checkout__field">
                    <label>Apellido *</label>
                    <input {...formEnvio.register('apellido', { required: 'El apellido es requerido' })} />
                    {formEnvio.formState.errors.apellido && <span className="checkout__error">{formEnvio.formState.errors.apellido.message}</span>}
                  </div>
                </div>

                <div className="checkout__field">
                  <label>Dirección *</label>
                  <input
                    placeholder="Colonia, calle, número de casa"
                    {...formEnvio.register('direccion', {
                      required: 'La dirección es requerida',
                      minLength: { value: 10, message: 'Sé más específico, mínimo 10 caracteres' },
                    })}
                  />
                  {formEnvio.formState.errors.direccion && <span className="checkout__error">{formEnvio.formState.errors.direccion.message}</span>}
                </div>

                <div className="checkout__row">
                  <div className="checkout__field">
                    <label>Ciudad *</label>
                    <input
                      placeholder="San Salvador"
                      {...formEnvio.register('ciudad', { required: 'La ciudad es requerida' })}
                    />
                    {formEnvio.formState.errors.ciudad && <span className="checkout__error">{formEnvio.formState.errors.ciudad.message}</span>}
                  </div>
                  <div className="checkout__field">
                    <label>Teléfono *</label>
                    <input
                      placeholder="7777-7777"
                      {...formEnvio.register('telefono', {
                        required: 'El teléfono es requerido',
                        pattern: { value: /^[0-9]{4}-?[0-9]{4}$/, message: 'Formato: 7777-7777' },
                      })}
                    />
                    {formEnvio.formState.errors.telefono && <span className="checkout__error">{formEnvio.formState.errors.telefono.message}</span>}
                  </div>
                </div>

                <Boton texto="Continuar al pago →" tipo="submit" variante="primary" tamano="full" />
              </form>
            )}

            {paso === 2 && (
              <form onSubmit={formPago.handleSubmit(enviarPasoPago)} className="checkout__form" noValidate>
                <h2>Datos de pago</h2>

                <div className="checkout__wompi">
                  <span className="checkout__wompi-badge">Pago procesado por Wompi</span>
                  <p>
                    La cuenta está en <strong>modo de prueba</strong>: la transacción viaja
                    de verdad a Wompi, pero no se cobra dinero real.
                  </p>
                  <button
                    type="button"
                    className="checkout__demo"
                    onClick={() => {
                      formPago.setValue('numero', TARJETA_DEMO.numero);
                      formPago.setValue('cvv', TARJETA_DEMO.cvv);
                      formPago.setValue('mes', TARJETA_DEMO.mes);
                      formPago.setValue('anio', TARJETA_DEMO.anio);
                      toast('Tarjeta de prueba cargada', { icon: '💳' });
                    }}
                  >
                    Usar tarjeta de prueba
                  </button>
                </div>

                <div className="checkout__field">
                  <label>Número de tarjeta *</label>
                  <input
                    inputMode="numeric"
                    placeholder="4573 6900 0199 0693"
                    {...formPago.register('numero', {
                      required: 'El número de tarjeta es requerido',
                      validate: (v) =>
                        v.replace(/\s/g, '').length >= 15 || 'El número de tarjeta está incompleto',
                    })}
                  />
                  {formPago.formState.errors.numero && <span className="checkout__error">{formPago.formState.errors.numero.message}</span>}
                </div>

                <div className="checkout__row checkout__row--3">
                  <div className="checkout__field">
                    <label>Mes *</label>
                    <input
                      inputMode="numeric"
                      placeholder="12"
                      {...formPago.register('mes', {
                        required: 'Requerido',
                        validate: (v) => (+v >= 1 && +v <= 12) || 'Mes inválido',
                      })}
                    />
                    {formPago.formState.errors.mes && <span className="checkout__error">{formPago.formState.errors.mes.message}</span>}
                  </div>
                  <div className="checkout__field">
                    <label>Año *</label>
                    <input
                      inputMode="numeric"
                      placeholder="2029"
                      {...formPago.register('anio', {
                        required: 'Requerido',
                        validate: (v) => v.length === 4 || 'Usa 4 dígitos',
                      })}
                    />
                    {formPago.formState.errors.anio && <span className="checkout__error">{formPago.formState.errors.anio.message}</span>}
                  </div>
                  <div className="checkout__field">
                    <label>CVV *</label>
                    <input
                      inputMode="numeric"
                      placeholder="835"
                      {...formPago.register('cvv', {
                        required: 'Requerido',
                        pattern: { value: /^[0-9]{3,4}$/, message: '3 o 4 dígitos' },
                      })}
                    />
                    {formPago.formState.errors.cvv && <span className="checkout__error">{formPago.formState.errors.cvv.message}</span>}
                  </div>
                </div>

                <div className="checkout__acciones">
                  <Boton texto="← Volver" variante="ghost" onClick={() => setPaso(1)} />
                  <Boton texto="Revisar pedido →" tipo="submit" variante="primary" />
                </div>
              </form>
            )}

            {paso === 3 && (
              <div className="checkout__form">
                <h2>Revisa tu pedido</h2>

                <section className="checkout__revision">
                  <h3>Se envía a</h3>
                  <p>{envio.nombre} {envio.apellido}</p>
                  <p>{envio.direccion}, {envio.ciudad}</p>
                  <p>Tel. {envio.telefono}</p>
                  <button className="checkout__cambiar" onClick={() => setPaso(1)}>Cambiar</button>
                </section>

                <section className="checkout__revision">
                  <h3>Se paga con</h3>
                  <p>Tarjeta terminada en •••• {tarjeta.numero.replace(/\s/g, '').slice(-4)}</p>
                  <p>Vence {tarjeta.mes}/{tarjeta.anio}</p>
                  <button className="checkout__cambiar" onClick={() => setPaso(2)}>Cambiar</button>
                </section>

                <section className="checkout__revision">
                  <h3>Productos ({items.length})</h3>
                  {items.map((item) => (
                    <div key={item.id} className="checkout__producto">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>Cantidad: {item.quantity}</span>
                      </div>
                      <span className="checkout__producto-precio">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </section>

                <div className="checkout__acciones">
                  <Boton texto="← Volver" variante="ghost" onClick={() => setPaso(2)} disabled={procesando} />
                  <Boton
                    texto={procesando ? 'Procesando pago...' : `Pagar $${total.toFixed(2)}`}
                    variante="primary"
                    onClick={confirmarCompra}
                    disabled={procesando}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="checkout__resumen">
            <h3>Resumen</h3>
            <div className="checkout__linea"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="checkout__linea">
              <span>Envío</span>
              <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="checkout__linea"><span>IVA (13%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="checkout__linea checkout__linea--total">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
