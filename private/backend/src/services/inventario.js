import productModel from "../models/products.js";

// Devuelve al inventario las unidades de un pedido (al cancelarlo). Cada
// producto se actualiza con $inc, que es atómico. Si un producto ya no existe
// simplemente no hay nada que sumar. Nunca tira: el pedido ya quedó cancelado,
// y si algo falla se deja todo en el log para corregir el stock a mano.
export const devolverStockDePedido = async (pedido) => {
  const operaciones = (pedido.products ?? [])
    .filter((linea) => linea.productId && linea.quantity > 0)
    .map((linea) => ({
      updateOne: {
        filter: { _id: linea.productId },
        update: { $inc: { stock: linea.quantity } },
      },
    }));

  if (operaciones.length === 0) return;

  try {
    await productModel.bulkWrite(operaciones, { ordered: false });
  } catch (error) {
    const lineas = (pedido.products ?? []).map((l) => ({ productId: String(l.productId), quantity: l.quantity }));
    console.log(
      `[inventario] CRÍTICO: el pedido ${pedido._id} quedó cancelado pero no se pudo devolver todo su stock. Corregir a mano: ${JSON.stringify(lineas)}:`,
      error.message
    );
  }
};
