import productModel from "../models/products.js";

import { v2 as cloudinary } from "cloudinary";

const productsController = {};

// "" / null / undefined = el campo no vino (un formulario vacío manda "")
const vino = (valor) => valor !== undefined && valor !== null && valor !== "";

// Precio: número finito >= 0. Stock: entero >= 0. Devuelven null si no sirven.
const leerPrecio = (valor) => {
  const numero = typeof valor === "number" ? valor : Number(String(valor).trim());
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
};
const leerStock = (valor) => {
  const numero = typeof valor === "number" ? valor : Number(String(valor).trim());
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
};

const MSG_PRECIO = "El precio debe ser un número mayor o igual a 0";
const MSG_STOCK = "El stock debe ser un número entero mayor o igual a 0";

// La imagen ya se subió a Cloudinary ANTES de llegar al controlador (multer).
// Si el producto no se guarda, se borra para que no quede huérfana.
const descartarImagen = async (req) => {
  if (!req.file?.filename) return;
  try {
    await cloudinary.uploader.destroy(req.file.filename);
  } catch (error) {
    console.log("No se pudo borrar la imagen huérfana de Cloudinary:", error.message);
  }
};

// Errores de datos del cliente (validación del modelo, ids mal formados) son
// 400, no 500.
const respuestaDeError = (error, res) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.name === "CastError" ? "Algún dato no es válido" : error.message });
  }
  console.log(error);
  return res.status(500).json({ message: "Error interno" });
};

productsController.getProducts = async (req, res) => {
  try {
    const products = await productModel.find().populate("category", "name");
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: "Error interno" });
  }
};

productsController.getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json(product);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

productsController.insertProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, stock, category, condition, storage, ram, color, featured } = req.body;

    const precio = leerPrecio(price);
    if (precio === null) {
      await descartarImagen(req);
      return res.status(400).json({ message: MSG_PRECIO });
    }

    const existencias = vino(stock) ? leerStock(stock) : 0;
    if (existencias === null) {
      await descartarImagen(req);
      return res.status(400).json({ message: MSG_STOCK });
    }

    const newProduct = new productModel({
      name,
      description,
      price: precio,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : 0,
      stock: existencias,
      category: category || null,
      image: req.file ? req.file.path : null,
      public_id: req.file ? req.file.filename : null,
      condition: condition || "Nuevo",
      storage,
      ram,
      color,
      featured: featured === "true" || featured === true,
    });

    await newProduct.save();
    const populated = await productModel.findById(newProduct._id).populate("category", "name");
    return res.status(201).json({ message: "Producto creado", product: populated });
  } catch (error) {
    await descartarImagen(req);
    return respuestaDeError(error, res);
  }
};

productsController.updateProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, stock, category, condition, storage, ram, color, featured } = req.body;

    // Identifico cuál producto voy a actualizar
    const productFound = await productModel.findById(req.params.id);
    if (!productFound) {
      await descartarImagen(req);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const updateData = {
      name, description,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : 0,
      category: category || null,
      condition: condition || "Nuevo",
      storage, ram, color,
      featured: featured === "true" || featured === true,
    };

    // Precio y stock: si no vienen se dejan como están (antes un stock omitido
    // se guardaba como 0); si vienen, tienen que ser válidos.
    if (vino(price)) {
      const precio = leerPrecio(price);
      if (precio === null) {
        await descartarImagen(req);
        return res.status(400).json({ message: MSG_PRECIO });
      }
      updateData.price = precio;
    }
    if (vino(stock)) {
      const existencias = leerStock(stock);
      if (existencias === null) {
        await descartarImagen(req);
        return res.status(400).json({ message: MSG_STOCK });
      }
      updateData.stock = existencias;
    }

    // Si viene una imagen nueva, guardo su dato y borro la anterior de Cloudinary
    // DESPUÉS de guardar el producto (si falla algo, la imagen vieja sigue siendo la válida)
    if (req.file) {
      updateData.image = req.file.path;
      updateData.public_id = req.file.filename;
    }

    const updated = await productModel
      .findByIdAndUpdate(req.params.id, updateData, { returnDocument: "after", runValidators: true })
      .populate("category", "name");

    // Best-effort y aparte: el producto ya se guardó con la imagen nueva, así
    // que si esto falla NO se debe borrar la nueva (lo haría el catch de abajo).
    if (req.file && productFound.public_id) {
      try {
        await cloudinary.uploader.destroy(productFound.public_id);
      } catch (error) {
        console.log("No se pudo borrar la imagen anterior de Cloudinary:", error.message);
      }
    }

    return res.status(200).json({ message: "Producto actualizado", product: updated });
  } catch (error) {
    await descartarImagen(req);
    return respuestaDeError(error, res);
  }
};

productsController.deleteProduct = async (req, res) => {
  try {
    // Busco el producto a eliminar
    const productFound = await productModel.findById(req.params.id);
    if (!productFound) return res.status(404).json({ message: "Producto no encontrado" });

    // Elimino la imagen de Cloudinary
    if (productFound.public_id) {
      await cloudinary.uploader.destroy(productFound.public_id);
    }

    // Elimino de la base de datos
    await productModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Producto eliminado" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

productsController.countProducts = async (req, res) => {
  try {
    const count = await productModel.countDocuments();
    return res.status(200).json({ count });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

export default productsController;
