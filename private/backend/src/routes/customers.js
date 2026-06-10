import express from "express";
import customersController from "../controller/customersController.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/count", verifyAdmin, customersController.countCustomers);

router.route("/")
  .get(verifyAdmin, customersController.getCustomers);

router.route("/:id")
  .get(verifyAdmin, customersController.getCustomerById)
  .delete(verifyAdmin, customersController.deleteCustomer);

export default router;
