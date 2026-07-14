/**
 * Script de un solo uso: sube a Cloudinary las imágenes que hoy viven como
 * archivos locales en uploads/ y actualiza cada documento con la URL de
 * Cloudinary (image) y su identificador (public_id).
 *
 * Uso:  node scripts/migrarImagenesACloudinary.js
 *
 * Es idempotente: los documentos cuya imagen ya es una URL https:// se saltan,
 * así que se puede volver a correr sin duplicar nada en Cloudinary.
 */
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { config } from "../config.js";
import productModel from "../src/models/products.js";
import categoryModel from "../src/models/categories.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

// Sube un archivo local a Cloudinary y devuelve { image, public_id }
const subirImagen = async (rutaLocal) => {
  const resultado = await cloudinary.uploader.upload(rutaLocal, {
    folder: "Applefly",
  });
  return { image: resultado.secure_url, public_id: resultado.public_id };
};

const migrarColeccion = async (modelo, etiqueta) => {
  const documentos = await modelo.find();
  let subidas = 0;
  let saltadas = 0;
  let sinArchivo = 0;

  for (const doc of documentos) {
    if (!doc.image) {
      saltadas++;
      continue;
    }

    // Ya está en Cloudinary (o en cualquier URL absoluta): no hay nada que hacer
    if (doc.image.startsWith("http")) {
      saltadas++;
      continue;
    }

    const nombreArchivo = path.basename(doc.image);
    const rutaLocal = path.join(uploadsDir, nombreArchivo);

    if (!fs.existsSync(rutaLocal)) {
      console.log(`  [!] ${etiqueta} "${doc.name}": no existe el archivo ${nombreArchivo}`);
      sinArchivo++;
      continue;
    }

    const { image, public_id } = await subirImagen(rutaLocal);
    await modelo.findByIdAndUpdate(doc._id, { image, public_id });

    console.log(`  [ok] ${etiqueta} "${doc.name}" -> ${image}`);
    subidas++;
  }

  console.log(`${etiqueta}: ${subidas} subidas, ${saltadas} sin imagen o ya migradas, ${sinArchivo} con archivo faltante\n`);
};

const main = async () => {
  await mongoose.connect(config.db.URI);
  console.log(`Conectado a: ${config.db.URI}\n`);

  await migrarColeccion(productModel, "Producto");
  await migrarColeccion(categoryModel, "Categoría");

  await mongoose.disconnect();
  console.log("Migración de imágenes terminada.");
};

main().catch((error) => {
  console.error("Falló la migración:", error);
  process.exit(1);
});
