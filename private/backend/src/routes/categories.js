import express from "express";
import categoriesController from "../controller/categoriesController.js";
import { upload } from "../middlewares/uploadImage.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.route("/")
  .get(categoriesController.getCategories)
  .post(verifyAdmin, upload.single("image"), categoriesController.insertCategory);

router.route("/:id")
  .get(categoriesController.getCategoryById)
  .put(verifyAdmin, upload.single("image"), categoriesController.updateCategory)
  .delete(verifyAdmin, categoriesController.deleteCategory);

export default router;
