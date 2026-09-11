// Traduce los códigos de error de Firebase Auth a mensajes en español,
// para no mostrarle al usuario cosas como "auth/invalid-credential".
const MENSAJES = {
  'auth/email-already-in-use': 'Ese correo ya está registrado.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en unos minutos.',
  'auth/network-request-failed': 'No hay conexión a internet.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
};

export function mensajeErrorFirebase(error) {
  return MENSAJES[error?.code] || 'Ocurrió un error. Intentá de nuevo.';
}
