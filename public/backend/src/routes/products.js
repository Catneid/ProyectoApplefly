import express from "express";
import productsController from "../controller/productsController.js";

const router = express.Router();

// La tienda solo lee productos. Crearlos, editarlos y borrarlos es
// tarea del panel de administración (private/backend).
router.route("/").get(productsController.getProducts);
router.route("/:id").get(productsController.getProductById);

export default router;
