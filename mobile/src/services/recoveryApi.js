import { apiFetch } from './api';

// Recuperación de contraseña por la API (public/backend, /api/recoveryPassword),
// el mismo flujo de la web: código de 6 dígitos por correo. En la web el token
// de recuperación viaja en una cookie; en React Native las cookies no son
// confiables, así que el backend también lo devuelve en el body y acá se manda
// de vuelta en el header X-Recovery-Token.

// Paso 1. La respuesta es la misma exista o no el correo (así nadie averigua
// qué correos tienen cuenta). Devuelve { message, token }.
export const pedirCodigoRecuperacion = (email) =>
  apiFetch('/recoveryPassword/requestCode', { method: 'POST', body: { email } });

// Paso 2. Devuelve { message, token }: el token nuevo es el "verificado", el
// que acepta el paso 3.
export const verificarCodigoRecuperacion = (token, codigo) =>
  apiFetch('/recoveryPassword/verifyCode', {
    method: 'POST',
    headers: { 'X-Recovery-Token': token },
    body: { codeRequest: codigo },
  });

// Paso 3. Cambia la contraseña de la cuenta (el backend la actualiza también en
// Firebase, que es con lo que entra la app).
export const cambiarPasswordRecuperacion = (token, newPassword, confirmNewPassword) =>
  apiFetch('/recoveryPassword/newPassword', {
    method: 'POST',
    headers: { 'X-Recovery-Token': token },
    body: { newPassword, confirmNewPassword },
  });
