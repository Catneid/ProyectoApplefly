import express from "express";
import { validarId } from "../middlewares/validarId.js";
import employeesController from "../controller/employeesController.js";
import { verifyAdmin, requireRole } from "../middlewares/verifyToken.js";

const router = express.Router();
router.param("id", validarId);

router.route("/")
  .get(verifyAdmin, requireRole("admin"), employeesController.getEmployees)
  .post(verifyAdmin, requireRole("admin"), employeesController.insertEmployee);

router.route("/:id")
  .put(verifyAdmin, requireRole("admin"), employeesController.updateEmployee)
  .delete(verifyAdmin, requireRole("admin"), employeesController.deleteEmployee);

export default router;
