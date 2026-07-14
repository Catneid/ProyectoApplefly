import express from "express";
import logoutController from "../controller/logoutController.js";

const router = express.Router();

router.route("/").post(logoutController.logoutCustomer);

export default router;
