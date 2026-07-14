import express from "express";
import loginCustomerController from "../controller/loginCustomerController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.route("/").post(loginCustomerController.login);
router.route("/verify").get(verifyToken, loginCustomerController.verify);

export default router;
