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

export default categoriesController;
