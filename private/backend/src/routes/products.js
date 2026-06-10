import express from "express";
import productsController from "../controller/productsController.js";
import { upload } from "../middlewares/uploadImage.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/count", productsController.countProducts);

router.route("/")
  .get(productsController.getProducts)
  .post(verifyAdmin, upload.single("image"), productsController.insertProduct);

router.route("/:id")
  .get(productsController.getProductById)
  .put(verifyAdmin, upload.single("image"), productsController.updateProduct)
  .delete(verifyAdmin, productsController.deleteProduct);

export default router;
