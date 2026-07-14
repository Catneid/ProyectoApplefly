import categoryModel from "../models/categories.js";

import { v2 as cloudinary } from "cloudinary";

const categoriesController = {};

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
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

categoriesController.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Identifico cuál categoría voy a actualizar
    const categoryFound = await categoryModel.findById(req.params.id);
    if (!categoryFound) return res.status(404).json({ message: "Categoría no encontrada" });

    const updateData = { name, description };

    // Si viene una imagen nueva, borro la anterior de Cloudinary y guardo la nueva
    if (req.file) {
      if (categoryFound.public_id) {
        await cloudinary.uploader.destroy(categoryFound.public_id);
      }
      updateData.image = req.file.path;
      updateData.public_id = req.file.filename;
    }

    const updated = await categoryModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

    return res.status(200).json({ message: "Categoría actualizada", category: updated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
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
