import express from "express";
import recoveryPasswordController from "../controller/recoveryPasswordController.js";

const router = express.Router();

/**
 * @swagger
 * /recoveryPassword/requestCode:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Solicita un código de recuperación de contraseña por correo
 *     description: >
 *       Genera un código de 6 caracteres y lo guarda en una cookie httpOnly
 *       `recoveryCookie` (15 min), luego lo envía por correo. El siguiente
 *       paso (/verifyCode) necesita esa misma cookie, así que las tres
 *       llamadas de este flujo deben hacerse desde el mismo navegador/cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Código enviado, revisa tu correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: No existe una cuenta con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error al enviar el correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/requestCode").post(recoveryPasswordController.requestCode);

/**
 * @swagger
 * /recoveryPassword/verifyCode:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Verifica el código de recuperación
 *     description: >
 *       Requiere la cookie `recoveryCookie` creada en el paso anterior. Si el
 *       código es correcto, renueva esa misma cookie marcándola como
 *       `verified: true` (otros 15 min) — ese flag es lo que /newPassword
 *       revisa antes de dejar cambiar la contraseña.
 *     security:
 *       - recoveryCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codeRequest]
 *             properties:
 *               codeRequest:
 *                 type: string
 *                 example: a1b2c3
 *     responses:
 *       200:
 *         description: Código verificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Código incorrecto, o expiró (no hay cookie recoveryCookie)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/verifyCode").post(recoveryPasswordController.verifyCode);

/**
 * @swagger
 * /recoveryPassword/newPassword:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Define la nueva contraseña tras verificar el código
 *     description: >
 *       Requiere que /verifyCode se haya llamado antes en la misma sesión de
 *       cookies (revisa el flag `verified` dentro de recoveryCookie). Al
 *       terminar, limpia recoveryCookie y resetea los intentos de login
 *       fallidos y el bloqueo temporal de la cuenta.
 *     security:
 *       - recoveryCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword, confirmNewPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: >
 *           Las contraseñas no coinciden, el código expiró (no hay
 *           recoveryCookie), o no se verificó el código antes (verified: false)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/newPassword").post(recoveryPasswordController.newPassword);

export default router;
