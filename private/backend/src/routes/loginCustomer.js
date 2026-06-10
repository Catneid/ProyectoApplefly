import express from "express";
import loginCustomerController from "../controller/loginCustomerController.js";

const router = express.Router();

router.post("/", loginCustomerController.login);

export default router;
