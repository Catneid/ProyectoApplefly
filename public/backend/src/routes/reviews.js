import express from "express";
import reviewsController from "../controller/reviewsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Leer reseñas es público; escribirlas exige sesión y haber comprado.
router.route("/producto/:productId").get(reviewsController.getReviewsByProduct);
router.route("/puedo-resenar/:productId").get(verifyToken, reviewsController.canReview);

router.route("/").post(verifyToken, reviewsController.createReview);
router
  .route("/:id")
  .put(verifyToken, reviewsController.updateReview)
  .delete(verifyToken, reviewsController.deleteReview);

export default router;
