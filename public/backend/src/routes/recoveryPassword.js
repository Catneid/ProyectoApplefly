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
 *       Genera un código numérico de 6 dígitos y firma un token de recuperación
 *       (JWT, `typ: recovery`, 15 min) que lleva solo su hash (nunca el código).
 *       El token llega de dos formas: en la cookie httpOnly `recoveryCookie`
 *       (la web) y en el body como `token` (la app mobile, que no usa cookies).
 *       Si el correo está registrado, el código se envía por correo. La
 *       respuesta es idéntica exista o no la cuenta (también el `token`), para
 *       no revelar qué correos están registrados. Máximo 3 códigos por hora por
 *       correo (se guarda en Mongo con TTL): a partir del cuarto la respuesta es
 *       la misma, pero no se envía ningún correo. Los pasos siguientes
 *       (/verifyCode y /newPassword) necesitan ese token: por la cookie, o por
 *       el header `X-Recovery-Token`.
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
 *         description: Si el correo está registrado, te enviamos un código
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: Token de recuperación (el mismo de la cookie), para mandarlo en X-Recovery-Token
 *       400:
 *         description: Correo inválido
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
router.route("/requestCode").post(recoveryPasswordController.requestCode);

/**
 * @swagger
 * /recoveryPassword/verifyCode:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Verifica el código de recuperación
 *     description: >
 *       Requiere el token del paso anterior: la cookie `recoveryCookie` o, si no
 *       hay cookie, el header `X-Recovery-Token`. Máximo 5 intentos por código
 *       y un código solo se puede verificar una vez. Si es correcto, se emite un
 *       token nuevo con `verified: true` (otros 15 min), de un solo uso: llega
 *       en la cookie (renovada) y en el body como `token`. Ese flag es lo que
 *       /newPassword revisa antes de dejar cambiar la contraseña.
 *     security:
 *       - recoveryCookieAuth: []
 *       - recoveryTokenAuth: []
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
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código verificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: Token verificado, para mandarlo en X-Recovery-Token a /newPassword
 *       400:
 *         description: Código incorrecto (el mensaje indica los intentos restantes), o expiró (no hay token, venció o ya se usó)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: >
 *           5 intentos fallidos. El código queda invalidado (se borra la cookie,
 *           `code: TOO_MANY_ATTEMPTS`) y hay que pedir uno nuevo con /requestCode.
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
 *       Requiere el token verificado que devolvió /verifyCode (cookie
 *       `recoveryCookie` o header `X-Recovery-Token`); revisa el flag `verified`
 *       y lo marca como usado, así que solo sirve una vez. Cambia la contraseña
 *       en Mongo (web) y, si el cliente usa la app, también en Firebase (por su
 *       firebaseUid, o buscándolo por correo si Firebase lo tiene verificado),
 *       para que sea la misma en la web y en la app. Si Firebase falla solo se
 *       registra en el log y la respuesta sigue siendo 200. Al terminar limpia
 *       recoveryCookie y resetea los intentos de login fallidos y el bloqueo
 *       temporal de la cuenta.
 *     security:
 *       - recoveryCookieAuth: []
 *       - recoveryTokenAuth: []
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
 *           La contraseña tiene menos de 6 caracteres, las contraseñas no
 *           coinciden, el código expiró (no hay token, venció o ya se usó), o no
 *           se verificó el código antes (verified: false)
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
