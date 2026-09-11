import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { config } from "../../config.js";

// Misma cuenta de Cloudinary que ya usa private/backend para las fotos de
// producto (mismas credenciales, en el .env de este backend también) — acá
// solo la reconfiguramos porque private/backend y public/backend son dos
// procesos de Node distintos, no pueden compartir la instancia en memoria.
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

// Carpeta por uid: params puede ser una función porque multer-storage-cloudinary
// la evalúa por archivo, ya con req disponible. Como verifyFirebaseToken corre
// ANTES que este middleware en la ruta, req.uidApp ya está seteado acá.
const storageFotoPerfil = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: `applefly/perfiles-app/${req.uidApp}`,
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  }),
});

export const uploadFotoPerfilApp = multer({
  storage: storageFotoPerfil,
  limits: { fileSize: 5 * 1024 * 1024 },
});
