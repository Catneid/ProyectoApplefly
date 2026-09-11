import express from "express";
import registerCustomerController from "../controller/registerCustomersController.js";
import { verifyFirebaseToken } from "../middlewares/verifyFirebaseToken.js";

const router = express.Router();

/**
 * @swagger
 * /registerCustomers:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Registra un cliente nuevo y envía un código de verificación por correo
 *     description: >
 *       No crea la cuenta todavía. Guarda los datos temporalmente en una cookie
 *       firmada (`verificationToken`, 15 min) y envía un código de 6 caracteres
 *       al correo. La cuenta se crea recién en /verifyCodeEmail.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Código enviado por correo
 *       400:
 *         description: El correo ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error al enviar el correo
 */
router.route("/").post(registerCustomerController.register);


/**
 * @swagger
 * /registerCustomers/verifyCodeEmail:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Confirma el código y crea la cuenta del cliente
 *     description: Requiere la cookie `verificationToken` que se creó en el paso anterior.
 *     security:
 *       - verificationTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationCodeRequest]
 *             properties:
 *               verificationCodeRequest:
 *                 type: string
 *                 example: a1b2c3
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *       400:
 *         description: Código incorrecto o sesión expirada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/verifyCodeEmail").post(registerCustomerController.verifyCode);


/**
 * @swagger
 * /registerCustomers/mobile:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Registra un cliente creado desde la app mobile (Firebase Auth)
 *     description: >
 *       Crea la cuenta directamente, sin código por correo (la verificación
 *       la maneja Firebase del lado de la app). Es el espejo en Mongo de una
 *       cuenta que ya existe en Firebase Auth, para que la misma cuenta sirva
 *       también para loguearse en la web.
 *     security:
 *       - firebaseIdTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               firebaseUid:
 *                 type: string
 *                 description: uid de Firebase Auth, para poder cruzar ambos registros después.
 *     responses:
 *       201:
 *         description: Cuenta creada
 *       400:
 *         description: Faltan correo o contraseña
 *       401:
 *         description: Falta el token de Firebase, o es inválido/expiró
 *       403:
 *         description: El uid del token no coincide con firebaseUid del body
 *       409:
 *         description: El correo ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
router.route("/mobile").post(verifyFirebaseToken, registerCustomerController.registerFromMobile);


export default router;
