import express from "express";
import logoutController from "../controller/logoutController.js";

const router = express.Router();

router.post("/customer", logoutController.logoutCustomer);
router.post("/admin", logoutController.logoutAdmin);

export default router;
