import express from "express";
import { validarId } from "../middlewares/validarId.js";
import ordersController from "../controller/ordersController.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();
router.param("id", validarId);

router.get("/count", verifyAdmin, ordersController.countOrders);

// Aquí el admin solo consulta y gestiona pedidos.
// Los pedidos los crea el cliente desde public/backend.
router.route("/")
  .get(verifyAdmin, ordersController.getOrders);

router.route("/:id")
  .get(verifyAdmin, ordersController.getOrderById)
  .put(verifyAdmin, ordersController.updateOrderStatus)
  .delete(verifyAdmin, ordersController.deleteOrder);

export default router;
