import mongoose from "mongoose";
import reviewModel from "../models/reviews.js";
import orderModel from "../models/orders.js";
import { leerResena } from "../utils/validaciones.js";

const reviewsController = {};

// El productId del BODY tiene que ser TEXTO con forma de ObjectId. Un objeto
// (p. ej. { "$ne": null }) o un texto cualquiera acabarían en un error de
// conversión de Mongo (500) en vez de un 400. (Los ids de la URL los valida el
// router con validarId y responden 404.)
const idValido = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

// Errores de datos del cliente (validación del modelo, valores que no se pueden
// convertir) son 400, no 500; el índice único (una reseña por producto) también.
const respuestaDeError = (error, res) => {
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ message: error.name === "CastError" ? "Algún dato no es válido" : error.message });
  }
  if (error?.code === 11000) {
    return res.status(400).json({ message: "Ya dejaste una reseña en este producto" });
  }
  console.log(error);
  return res.status(500).json({ message: "Error interno" });
};

const comproElProducto = async (customerId, productId) => {
  const pedido = await orderModel.findOne({
    customerId,
    "products.productId": productId,
    // Un pago que todavía no se confirmó (ver services/checkout.js) no cuenta
    // como compra. trusted(): este es un filtro nuestro, no del cliente.
    status: mongoose.trusted({ $ne: "pago-pendiente-revision" }),
  });

  return Boolean(pedido);
};


reviewsController.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({ productId: req.params.productId })
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};


reviewsController.canReview = async (req, res) => {
  try {
    const { productId } = req.params;

    const comprado = await comproElProducto(req.user.id, productId);
    const miReview = await reviewModel.findOne({
      productId,
      customerId: req.user.id,
    });

    return res.status(200).json({
      comprado,
      puedeReseñar: comprado && !miReview,
      miReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

reviewsController.createReview = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!idValido(productId)) {
      return res.status(400).json({ message: "Producto inválido" });
    }

    const { rating, comment, error } = leerResena(req.body);
    if (error) return res.status(400).json({ message: error });

    if (!(await comproElProducto(req.user.id, productId))) {
      return res.status(403).json({ message: "Solo puedes valorar productos que hayas comprado" });
    }

    const yaExiste = await reviewModel.findOne({ productId, customerId: req.user.id });
    if (yaExiste) {
      return res.status(400).json({ message: "Ya dejaste una reseña en este producto" });
    }

    const newReview = new reviewModel({
      productId,
      customerId: req.user.id,
      customerName: req.user.name,
      rating,
      comment,
    });

    await newReview.save();

    return res.status(201).json({ message: "¡Gracias por tu reseña!", review: newReview });
  } catch (error) {
    return respuestaDeError(error, res);
  }
};

reviewsController.updateReview = async (req, res) => {
  try {
    const { rating, comment, error } = leerResena(req.body);
    if (error) return res.status(400).json({ message: error });

    const review = await reviewModel.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Reseña no encontrada" });

    if (String(review.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    return res.status(200).json({ message: "Reseña actualizada", review });
  } catch (error) {
    return respuestaDeError(error, res);
  }
};

reviewsController.deleteReview = async (req, res) => {
  try {
    const review = await reviewModel.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Reseña no encontrada" });

    if (String(review.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    await reviewModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Reseña eliminada" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default reviewsController;
