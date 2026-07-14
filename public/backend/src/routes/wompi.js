import express from "express";
import wompiController from "../controller/wompiController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Solo un cliente con sesión iniciada puede iniciar un cobro.
router.route("/token").post(verifyToken, wompiController.generarToken);
router.route("/tokenizar").post(verifyToken, wompiController.tokenizarTarjeta);
router.route("/paymentTest").post(verifyToken, wompiController.paymentTest);
router.route("/payment3DS").post(verifyToken, wompiController.payment3DS);

export default router;
