import { getProductoPorId } from './products';

// Compara el carrito con el catálogo actual del backend. Lo usa el checkout
// antes de cobrar: los precios y el stock que guardó el carrito pueden estar
// viejos (el admin cambió un precio, otra persona compró lo último, etc.).
//
// Devuelve:
//   items   → el carrito ya actualizado (precio y nombre nuevos, cantidad
//             recortada al stock, sin los productos agotados o borrados)
//   cambios → frases para mostrarle a la persona; vacío si nada cambió
//
// Si no se puede consultar algún producto (sin red, error del servidor) TIRA:
// es mejor no cobrar que cobrar con datos sin confirmar.
export async function revisarCarritoContraCatalogo(items) {
  const actuales = await Promise.all(items.map((item) => getProductoPorId(item.productId)));

  const nuevos = [];
  const cambios = [];

  items.forEach((item, indice) => {
    const producto = actuales[indice];

    if (!producto) {
      cambios.push(`"${item.name}" ya no está disponible y se quitó del carrito.`);
      return;
    }

    const stock = Number(producto.stock ?? 0);
    if (stock <= 0) {
      cambios.push(`"${producto.name}" se agotó y se quitó del carrito.`);
      return;
    }

    let cantidad = item.quantity;
    if (cantidad > stock) {
      cambios.push(
        `De "${producto.name}" solo quedan ${stock} (tenías ${cantidad}); se ajustó la cantidad.`
      );
      cantidad = stock;
    }

    if (producto.price !== item.price) {
      cambios.push(
        `"${producto.name}" cambió de precio: de $${Number(item.price).toFixed(2)} a $${Number(producto.price).toFixed(2)}.`
      );
    }

    nuevos.push({
      ...item,
      name: producto.name,
      price: producto.price,
      image: producto.image || null,
      stock,
      quantity: cantidad,
    });
  });

  return { items: nuevos, cambios };
}
