// Reglas de precio de la tienda. Las usa el checkout del servidor
// (services/checkout.js), el único camino para cobrar, tanto para la web como
// para la app. public/frontend y mobile tienen su copia solo para mostrar un
// estimado antes de pagar; el monto que se cobra siempre sale de acá.
export const ENVIO = 15;
export const ENVIO_GRATIS_DESDE = 500;
export const IVA = 0.13;

export const redondear = (monto) => Math.round(monto * 100) / 100;

// A partir del subtotal (suma de precio × cantidad) calcula envío, IVA y total.
export const calcularTotales = (subtotal) => {
  const shipping = subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
  const tax = subtotal * IVA;
  const total = subtotal + shipping + tax;

  return {
    subtotal: redondear(subtotal),
    shipping,
    tax: redondear(tax),
    total: redondear(total),
  };
};
