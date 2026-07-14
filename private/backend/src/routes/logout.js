import express from "express";
import logoutController from "../controller/logoutController.js";

const router = express.Router();

// El logout del cliente vive en public/backend
router.post("/admin", logoutController.logoutAdmin);

export default router;
