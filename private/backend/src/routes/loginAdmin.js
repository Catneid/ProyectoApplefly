import express from "express";
import loginAdminController from "../controller/loginAdminController.js";

const router = express.Router();

router.post("/", loginAdminController.login);

export default router;
