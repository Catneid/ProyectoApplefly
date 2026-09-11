// Cliente del endpoint de foto de perfil de public/backend. La app nunca
// habla con Cloudinary directo: manda la imagen al backend (con su ID
// token de Firebase) y el backend la sube y devuelve el secure_url. La
// escritura en Firestore ("users/{uid}".photoURL) la hace la app misma,
// justo después de esta llamada — ver app/(tabs)/perfil.jsx.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function subirFotoPerfil({ idToken, uri }) {
  if (!BASE_URL) {
    throw new Error('La app no está configurada para subir imágenes (falta EXPO_PUBLIC_API_URL).');
  }

  const nombreArchivo = uri.split('/').pop() || 'foto.jpg';
  const extension = nombreArchivo.split('.').pop()?.toLowerCase();
  const tipo = extension === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('photo', { uri, name: nombreArchivo, type: tipo });

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/api/profile/app/foto`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        // Sin Content-Type a propósito: fetch arma el boundary de
        // multipart/form-data solo cuando el body es un FormData real.
      },
      body: formData,
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.message || 'No se pudo subir la imagen.');
  }

  return datos.secure_url;
}
