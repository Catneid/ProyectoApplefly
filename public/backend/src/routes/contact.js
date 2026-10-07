import express from "express";
import contactController from "../controller/contactController.js";
import { contactLimiter } from "../middlewares/limiter.js";

const router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     tags: [Contacto]
 *     summary: Envía un mensaje del formulario de contacto
 *     description: >
 *       Público (no requiere sesión), con un límite estricto de envíos por IP
 *       para que no sirva para llenar la base de basura.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Mensaje guardado
 *       400:
 *         description: Faltan datos o el correo no es válido
 *       429:
 *         description: Demasiados mensajes, intenta más tarde
 */
router.route("/").post(contactLimiter, contactController.create);

export default router;
