import express from "express";
import logoutController from "../controller/logoutController.js";

const router = express.Router();

/**
 * @swagger
 * /logout:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Cierra la sesión del cliente
 *     description: Limpia la cookie authCookie. No requiere body ni estar autenticado (limpiar una cookie que no existe no da error).
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada
 */

router.route("/").post(logoutController.logoutCustomer);


export default router;
