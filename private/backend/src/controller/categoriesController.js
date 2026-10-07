import categoryModel from "../models/categories.js";

import { v2 as cloudinary } from "cloudinary";

const categoriesController = {};

// La imagen ya se subió a Cloudinary ANTES de llegar al controlador (multer).
// Si la categoría no se guarda, se borra para que no quede huérfana.
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

categoriesController.getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    return res.status(200).json(categories);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

categoriesController.getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });
    return res.status(200).json(category);
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

categoriesController.insertCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newCategory = new categoryModel({
      name,
      description,
      image: req.file ? req.file.path : null,
      public_id: req.file ? req.file.filename : null,
    });
    await newCategory.save();

    return res.status(201).json({ message: "Categoría creada", category: newCategory });
  } catch (error) {
    await descartarImagen(req);
    return respuestaDeError(error, res);
  }
};

categoriesController.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Identifico cuál categoría voy a actualizar
    const categoryFound = await categoryModel.findById(req.params.id);
    if (!categoryFound) {
      await descartarImagen(req);
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const updateData = { name, description };

    // Si viene una imagen nueva, guardo su dato y borro la anterior de Cloudinary
    // DESPUÉS de guardar (si falla algo, la imagen vieja sigue siendo la válida)
    if (req.file) {
      updateData.image = req.file.path;
      updateData.public_id = req.file.filename;
    }

    const updated = await categoryModel.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    // Best-effort y aparte: la categoría ya se guardó con la imagen nueva, así
    // que si esto falla NO se debe borrar la nueva (lo haría el catch de abajo).
    if (req.file && categoryFound.public_id) {
      try {
        await cloudinary.uploader.destroy(categoryFound.public_id);
      } catch (error) {
        console.log("No se pudo borrar la imagen anterior de Cloudinary:", error.message);
      }
    }

    return res.status(200).json({ message: "Categoría actualizada", category: updated });
  } catch (error) {
    await descartarImagen(req);
    return respuestaDeError(error, res);
  }
};

categoriesController.deleteCategory = async (req, res) => {
  try {
    // Busco la categoría a eliminar
    const categoryFound = await categoryModel.findById(req.params.id);
    if (!categoryFound) return res.status(404).json({ message: "Categoría no encontrada" });

    // Elimino la imagen de Cloudinary
    if (categoryFound.public_id) {
      await cloudinary.uploader.destroy(categoryFound.public_id);
    }

    // Elimino de la base de datos
    await categoryModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Categoría eliminada" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default categoriesController;
