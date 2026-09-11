import express from "express";
import wompiAppController from "../controller/wompiAppController.js";
import { verifyFirebaseToken } from "../middlewares/verifyFirebaseToken.js";

const router = express.Router();

/**
 * @swagger
 * /wompi/app/cobrar:
 *   post:
 *     tags: [Pagos - App móvil]
 *     summary: Cobra una tarjeta con Wompi y, si aprueba, crea el pedido en Firestore
 *     description: >
 *       Ruta separada de /wompi (la que usa la web): pensada para la app
 *       mobile, que nunca ve las credenciales de Wompi ni escribe pedidos
 *       directo en Firestore. Si el cobro es rechazado, no se crea ningún
 *       pedido.
 *     security:
 *       - firebaseIdTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, address, phone, total, tarjeta]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               subtotal:
 *                 type: number
 *               shipping:
 *                 type: number
 *               tax:
 *                 type: number
 *               total:
 *                 type: number
 *               customerName:
 *                 type: string
 *               tarjeta:
 *                 type: object
 *                 properties:
 *                   numero:
 *                     type: string
 *                   mes:
 *                     type: string
 *                   anio:
 *                     type: string
 *                   cvv:
 *                     type: string
 *                   titular:
 *                     type: string
 *     responses:
 *       201:
 *         description: Pago aprobado y pedido creado
 *       400:
 *         description: Faltan datos del pedido o de la tarjeta
 *       401:
 *         description: Falta el token de Firebase, o es inválido/expiró
 *       402:
 *         description: Wompi rechazó el cobro (no se creó ningún pedido)
 *       500:
 *         description: Error interno del servidor
 */
router.route("/cobrar").post(verifyFirebaseToken, wompiAppController.cobrar);

export default router;
