import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { config } from "../../config.js";

//#1- Configuramos cloudinary con nuestras credenciales
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

//#2- Como guardamos las imágenes
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Applefly",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

//#3- Configurar multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
