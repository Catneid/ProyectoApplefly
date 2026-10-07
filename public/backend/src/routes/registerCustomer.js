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
 *       firmada (`verificationToken`, 15 min) y envía un código de 6 dígitos
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
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *       400:
 *         description: Código incorrecto (el mensaje indica los intentos restantes) o sesión expirada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: >
 *           5 intentos fallidos. El código queda invalidado (se borra la cookie,
 *           `code: TOO_MANY_ATTEMPTS`) y hay que registrarse de nuevo.
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

/**
 * @swagger
 * /registerCustomers/link:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Vincula una cuenta de la web con el usuario de Firebase de la app
 *     description: >
 *       Para clientes que se registraron en la web y entran por primera vez a
 *       la app: su usuario de Firebase todavía no tiene el correo verificado,
 *       así que el backend no los vincula solo por correo. La prueba de que
 *       son la misma persona es la contraseña de la cuenta de la web. Usa los
 *       mismos intentos fallidos y bloqueo de 15 minutos que el login.
 *       Es idempotente: si ya estaban vinculados, responde 200.
 *     security:
 *       - firebaseIdTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Cuenta vinculada
 *       400:
 *         description: Falta la contraseña
 *       401:
 *         description: Token de Firebase inválido, o contraseña incorrecta
 *       403:
 *         description: Cuenta bloqueada temporalmente por intentos fallidos
 *       404:
 *         description: No hay una cuenta de la web con ese correo
 *       409:
 *         description: La cuenta ya está vinculada a otro usuario de la app
 */
router.route("/link").post(verifyFirebaseToken, registerCustomerController.linkFirebaseAccount);


export default router;
