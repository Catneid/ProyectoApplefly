// COPIA de public/backend/src/utils/precios.js (el servidor es quien cobra).
// Se calcula con exactamente las mismas operaciones y el mismo redondeo para
// que el total que se ve en la app no difiera ni un centavo del que se cobra.
// Si se cambia una regla de precio, hay que cambiarla en los dos archivos.
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
