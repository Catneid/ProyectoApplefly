// Este archivo NO tiene lógica: es solo la referencia de qué se guarda en
// Firestore. Los "@typedef" son JSDoc puro (se borran al compilar, no generan
// código); sirven para que el editor autocomplete si en algún lado hacés
// `/** @type {import('./firestoreSchema.js').UserProfile} */`.
//
// MongoDB (a través de la API de public/backend) es la ÚNICA fuente de verdad
// de productos, categorías, reseñas, pedidos y contacto — ver api.js. Firestore
// se usa solo para el perfil de la app y el push token, en la colección
// "users", y firestore.rules (en la raíz del repo) deja todo lo demás cerrado.
//
// -----------------------------------------------------------------------
// users
// -----------------------------------------------------------------------
// Doc id = uid de Firebase Auth. Cada usuario solo puede leer y escribir el
// suyo (firestore.rules). Lo escribe la app (src/context/AuthContext.jsx,
// app/(tabs)/perfil.jsx, src/services/pushNotifications.js) y lo lee, solo
// para mandar notificaciones, private/backend con el Admin SDK.
// {
//   name: string,
//   lastName: string,
//   birthdate: Date | null,
//   phone: string,
//   address: string,
//   photoURL: string,     // opcional — Cloudinary, la sube public/backend
//   pushToken: string,    // Expo push token del dispositivo (ver pushNotifications.js)
//   createdAt: Timestamp,
// }

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {string} lastName
 * @property {Date|null} birthdate
 * @property {string} phone
 * @property {string} address
 * @property {string} [photoURL]
 * @property {string} [pushToken]
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

export {};
