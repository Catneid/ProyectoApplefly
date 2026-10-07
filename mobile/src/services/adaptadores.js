// Traducen lo que devuelve la API de public/backend (MongoDB, la única fuente
// de verdad) a la forma que ya usan las pantallas de la app. Son funciones
// puras, sin red ni React: así las pantallas casi no cambian al pasar de
// Firestore a la API.

export function mapearProducto(p) {
  return {
    id: p._id,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    discount: p.discount ?? 0,
    stock: p.stock ?? 0,
    // La API trae la categoría poblada ({ _id, name }); puede ser null si la
    // categoría se borró.
    categoryId: p.category?._id ?? null,
    categoryName: p.category?.name ?? '',
    image: p.image ?? '',
    condition: p.condition || 'Nuevo',
    storage: p.storage ?? '',
    ram: p.ram ?? '',
    color: p.color ?? '',
    featured: Boolean(p.featured),
    rating: p.rating ?? 0,
    reviewsCount: p.reviews ?? 0,
    createdAt: p.createdAt ?? null,
  };
}

export function mapearCategoria(c) {
  return { id: c._id, name: c.name };
}

export function mapearResena(r) {
  return {
    id: r._id,
    productId: r.productId,
    userId: r.customerId,
    userName: r.customerName,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.createdAt ?? null,
  };
}

export function mapearPedido(o) {
  return { ...o, id: o._id };
}
