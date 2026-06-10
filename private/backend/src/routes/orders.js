import express from "express";
import ordersController from "../controller/ordersController.js";
import { verifyToken, verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/count", verifyAdmin, ordersController.countOrders);

router.route("/")
  .get(verifyAdmin, ordersController.getOrders)
  .post(verifyToken, ordersController.createOrder);

router.route("/:id")
  .get(verifyAdmin, ordersController.getOrderById)
  .put(verifyAdmin, ordersController.updateOrderStatus)
  .delete(verifyAdmin, ordersController.deleteOrder);

export default router;
