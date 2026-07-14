import express from "express";
import loginAdminController from "../controller/loginAdminController.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/verify", verifyAdmin, loginAdminController.verify);
router.post("/", loginAdminController.login);

export default router;
