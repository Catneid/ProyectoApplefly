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
    URI: process.env.DB_URI 
  },
  JWT: { 
    secret: process.env.JWT_Secret_key 
  },
  email: {
    user_email: process.env.USER_EMAIL,
    user_password: process.env.USER_PASSWORD,
  },
  // Solo lo usa scripts/seedAdmin.js
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || "Admin",
    lastName: process.env.ADMIN_LAST_NAME || "Applefly",
  },
  cloudinary: {
    cloudinary_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  },
};
