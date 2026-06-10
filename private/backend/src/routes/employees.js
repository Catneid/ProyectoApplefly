import express from "express";
import employeesController from "../controller/employeesController.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.route("/")
  .get(verifyAdmin, employeesController.getEmployees)
  .post(employeesController.insertEmployee);

router.route("/:id")
  .put(verifyAdmin, employeesController.updateEmployee)
  .delete(verifyAdmin, employeesController.deleteEmployee);

export default router;
