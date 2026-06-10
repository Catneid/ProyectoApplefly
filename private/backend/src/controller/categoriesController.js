import categoryModel from "../models/categories.js";

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
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newCategory = new categoryModel({ name, description, image: imageUrl });
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
    const updateData = { name, description };
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    const updated = await categoryModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Categoría no encontrada" });

    return res.status(200).json({ message: "Categoría actualizada", category: updated });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

categoriesController.deleteCategory = async (req, res) => {
  try {
    const deleted = await categoryModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Categoría no encontrada" });
    return res.status(200).json({ message: "Categoría eliminada" });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
};

export default categoriesController;
