import dotenv from "dotenv";
dotenv.config();

// Sin estas dos variables nada funciona (ni la base de datos ni las sesiones).
// Mejor fallar al arrancar con un mensaje claro que con un error raro después.
const faltan = ["DB_URI", "JWT_Secret_key"].filter((nombre) => !process.env[nombre]);
if (faltan.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas en el .env: ${faltan.join(", ")}`
  );
}

export const config = {
  db: {
    URI: process.env.DB_URI,
  },
  JWT: {
    secret: process.env.JWT_Secret_key,
  },
  email: {
    user_email: process.env.USER_EMAIL,
    user_password: process.env.USER_PASSWORD,
  },
  wompi: {
    grant_type: process.env.GRANT_TYPE,
    audience: process.env.AUDIENCE,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  },
  firebase: {
    webApiKey: process.env.FIREBASE_WEB_API_KEY,
  },
  cloudinary: {
    cloudinary_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  },
};
