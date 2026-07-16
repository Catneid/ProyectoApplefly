import reviewModel from "../models/reviews.js";
import orderModel from "../models/orders.js";

const reviewsController = {};

const comproElProducto = async (customerId, productId) => {
  const pedido = await orderModel.findOne({
    customerId,
    "products.productId": productId,
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
    const { productId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "La calificación debe ser de 1 a 5 estrellas" });
    }

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
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

reviewsController.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "La calificación debe ser de 1 a 5 estrellas" });
    }

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
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
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
