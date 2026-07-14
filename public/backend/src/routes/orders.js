import express from "express";
import ordersController from "../controller/ordersController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Todo lo de pedidos exige sesión iniciada: no se puede comprar
// ni ver el historial sin haber entrado a la cuenta.
router.route("/").post(verifyToken, ordersController.createOrder);
router.route("/mis-pedidos").get(verifyToken, ordersController.getMyOrders);
router.route("/:id").get(verifyToken, ordersController.getMyOrderById);

export default router;
