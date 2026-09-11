// Este archivo NO tiene lógica: es solo la referencia de cómo se guarda
// cada colección en Firestore, para que products.js / orders.js / el script
// de importación (scripts/importCatalogToFirestore.js) y quien lea esto
// después estén de acuerdo en la forma de los datos.
//
// Los "@typedef" son JSDoc puro (se borran al compilar, no generan código);
// sirven para que el editor autocomplete si en algún lado hacés
// `/** @type {import('./firestoreSchema.js').Product} */`.
//
// -----------------------------------------------------------------------
// products
// -----------------------------------------------------------------------
// {
//   name: string,
//   description: string,
//   price: number,
//   originalPrice: number | null,   // precio antes del descuento, si tiene
//   discount: number,               // % de descuento (0 si no tiene)
//   stock: number,
//   categoryId: string,             // id del documento en "categories" (NO el ObjectId de Mongo)
//   categoryName: string,           // desnormalizado, para no pegarle a "categories" en cada listado
//   image: string,                  // URL (Cloudinary)
//   condition: "Nuevo" | "Reacondicionado",
//   storage: string,                // ej: "128GB"
//   ram: string,                    // ej: "8GB"
//   color: string,
//   featured: boolean,
//   rating: number,                 // promedio desnormalizado (ver reviews)
//   reviewsCount: number,           // desnormalizado (ver reviews)
//   createdAt: Timestamp,
// }
//
// -----------------------------------------------------------------------
// categories
// -----------------------------------------------------------------------
// {
//   name: string,
// }
//
// -----------------------------------------------------------------------
// reviews
// -----------------------------------------------------------------------
// {
//   productId: string,   // id del documento en "products"
//   userId: string,      // uid de Firebase Auth
//   userName: string,    // desnormalizado, para no pegarle a "users" al listar reseñas
//   rating: number,      // 1 a 5
//   comment: string,
//   createdAt: Timestamp,
// }
//
// -----------------------------------------------------------------------
// orders
// -----------------------------------------------------------------------
// Los crea ÚNICAMENTE public/backend (src/controller/wompiAppController.js),
// con el Admin SDK, y solo después de que Wompi aprueba el cobro — la app
// nunca escribe acá directo (ver firestore.rules en la raíz del repo).
// {
//   customerId: string,      // uid de Firebase Auth
//   customerName: string,
//   customerEmail: string,
//   products: [
//     { productId: string, name: string, price: number, quantity: number, subtotal: number },
//   ],
//   subtotal: number,
//   shipping: number,
//   tax: number,
//   total: number,
//   status: "pendiente" | "procesando" | "enviado" | "entregado" | "cancelado",
//   address: string,
//   phone: string,
//   payment: {
//     method: string,
//     transactionId: string,
//     status: string,
//     cardLast4: string,
//   },
//   createdAt: Timestamp,
// }
//
// -----------------------------------------------------------------------
// users
// -----------------------------------------------------------------------
// Ya implementado en src/context/AuthContext.jsx (register/login). Doc id
// = uid de Firebase Auth.
// {
//   name: string,
//   lastName: string,
//   birthdate: Date | null,
//   phone: string,
//   address: string,
//   photoURL: string,     // opcional — Cloudinary, sube pública/backend (Fase 9)
//   createdAt: Timestamp,
// }
//
// -----------------------------------------------------------------------
// contactMessages
// -----------------------------------------------------------------------
// Escrito directo por la app (Fase 9), nadie los lee desde el cliente — ver
// firestore.rules en la raíz del repo.
// {
//   name: string,
//   email: string,
//   message: string,
//   createdAt: Timestamp,
// }

/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number|null} originalPrice
 * @property {number} discount
 * @property {number} stock
 * @property {string} categoryId
 * @property {string} categoryName
 * @property {string} image
 * @property {"Nuevo"|"Reacondicionado"} condition
 * @property {string} storage
 * @property {string} ram
 * @property {string} color
 * @property {boolean} featured
 * @property {number} rating
 * @property {number} reviewsCount
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} Category
 * @property {string} name
 */

/**
 * @typedef {Object} Review
 * @property {string} productId
 * @property {string} userId
 * @property {string} userName
 * @property {number} rating
 * @property {string} comment
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} OrderProduct
 * @property {string} productId
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} subtotal
 */

/**
 * @typedef {Object} OrderPayment
 * @property {string} method
 * @property {string} transactionId
 * @property {string} status
 * @property {string} cardLast4
 */

/**
 * @typedef {Object} Order
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} customerEmail
 * @property {OrderProduct[]} products
 * @property {number} subtotal
 * @property {number} shipping
 * @property {number} tax
 * @property {number} total
 * @property {"pendiente"|"procesando"|"enviado"|"entregado"|"cancelado"} status
 * @property {string} address
 * @property {string} phone
 * @property {OrderPayment} payment
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {string} lastName
 * @property {Date|null} birthdate
 * @property {string} phone
 * @property {string} address
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

export {};
