import express from "express";
import loginCustomerController from "../controller/loginCustomerController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();


/**
 * @swagger
 * /loginCustomers:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Inicia sesión y setea la cookie de sesión del cliente
 *     description: >
 *       Si la contraseña falla 5 veces seguidas, bloquea la cuenta 15 minutos
 *       (campo `timeOut` del cliente). Si todo sale bien, setea la cookie
 *       httpOnly `authCookie` (JWT, válida 30 días) — no hace falta que el
 *       frontend haga nada más con la respuesta, el navegador la guarda solo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso (setea la cookie authCookie)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Contraseña incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Correo sin verificar, o cuenta bloqueada temporalmente (15 min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No existe una cuenta con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
router.route("/").post(loginCustomerController.login);

/**
 * @swagger
 * /loginCustomers/verify:
 *   get:
 *     tags: [Auth - Clientes]
 *     summary: Verifica la cookie de sesión y devuelve los datos del cliente autenticado
 *     description: Úsalo para saber si hay una sesión activa (por ejemplo, al recargar la página en el frontend).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: Payload decodificado del JWT
 *                   properties:
 *                     id:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       example: customer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: No hay cookie, o el token es inválido/expiró
 *       403:
 *         description: El token no es de un cliente (userType distinto de "customer")
 */
router.route("/verify").get(verifyToken, loginCustomerController.verify);

export default router;
