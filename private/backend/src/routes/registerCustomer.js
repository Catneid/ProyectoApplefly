import express from "express";
import registerCustomerController from "../controller/registerCustomersController.js";

const router = express.Router();

router.post("/", registerCustomerController.register);
router.post("/verifyCodeEmail", registerCustomerController.verifyCode);

export default router;
