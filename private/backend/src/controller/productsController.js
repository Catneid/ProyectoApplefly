import productModel from "../models/products.js";

import { v2 as cloudinary } from "cloudinary";

const productsController = {};

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

    const newProduct = new productModel({
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : 0,
      stock: parseInt(stock) || 0,
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
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

productsController.updateProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, stock, category, condition, storage, ram, color, featured } = req.body;

    // Identifico cuál producto voy a actualizar
    const productFound = await productModel.findById(req.params.id);
    if (!productFound) return res.status(404).json({ message: "Producto no encontrado" });

    const updateData = {
      name, description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : 0,
      stock: parseInt(stock) || 0,
      category: category || null,
      condition: condition || "Nuevo",
      storage, ram, color,
      featured: featured === "true" || featured === true,
    };

    // Si viene una imagen nueva, borro la anterior de Cloudinary y guardo la nueva
    if (req.file) {
      if (productFound.public_id) {
        await cloudinary.uploader.destroy(productFound.public_id);
      }
      updateData.image = req.file.path;
      updateData.public_id = req.file.filename;
    }

    const updated = await productModel.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate("category", "name");

    return res.status(200).json({ message: "Producto actualizado", product: updated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
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
