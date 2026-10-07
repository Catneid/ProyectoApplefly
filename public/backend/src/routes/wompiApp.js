import express from "express";
import wompiAppController from "../controller/wompiAppController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

/**
 * @swagger
 * /wompi/app/cobrar:
 *   post:
 *     tags: [Pagos - App móvil]
 *     summary: Paga y crea el pedido (misma lógica que POST /orders/checkout)
 *     description: >
 *       Ruta de pago que ya usaba la app mobile, ahora sobre MongoDB: ejecuta
 *       exactamente lo mismo que `POST /orders/checkout` (ver ahí el detalle),
 *       con la forma de body y de respuesta que la app conocía (`items`,
 *       `aprobada`, `mensaje`). El pedido se crea en Mongo, así que aparece en
 *       el panel de administración.
 *
 *       **Del cliente solo se usa QUÉ se compra** (`items`: productId y
 *       quantity), a dónde va y la tarjeta. Cualquier precio, subtotal, envío,
 *       IVA o total que se mande se ignora: el servidor lo calcula (envío $15,
 *       gratis desde $500; IVA 13%). Si Wompi rechaza, el stock se devuelve y
 *       no se crea pedido.
 *     security:
 *       - firebaseIdTokenAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, address, phone, tarjeta]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: _id del producto en Mongo
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               customerName:
 *                 type: string
 *               tarjeta:
 *                 type: object
 *                 required: [numero, mes, anio, cvv]
 *                 properties:
 *                   numero:
 *                     type: string
 *                     description: 13 a 19 dígitos (se aceptan espacios)
 *                   mes:
 *                     type: string
 *                     example: "12"
 *                   anio:
 *                     type: string
 *                     example: "2029"
 *                   cvv:
 *                     type: string
 *                   titular:
 *                     type: string
 *     responses:
 *       201:
 *         description: Pago aprobado y pedido creado. Devuelve el desglose calculado por el servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                 aprobada:
 *                   type: boolean
 *                 mensaje:
 *                   type: string
 *                 cardLast4:
 *                   type: string
 *                 subtotal:
 *                   type: number
 *                 shipping:
 *                   type: number
 *                 tax:
 *                   type: number
 *                 total:
 *                   type: number
 *                   description: Monto que se cobró
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       quantity:
 *                         type: integer
 *                       subtotal:
 *                         type: number
 *       400:
 *         description: Items, tarjeta o datos de envío inválidos, o un producto ya no está disponible
 *       401:
 *         description: Falta el token de Firebase, o es inválido/expiró
 *       402:
 *         description: Wompi rechazó el cobro (el stock se devolvió y no se creó ningún pedido)
 *       403:
 *         description: Correo sin verificar
 *       409:
 *         description: No hay stock suficiente de algún producto (`product` y `available` en el body). No se cobró nada
 *       429:
 *         description: Demasiadas solicitudes
 *       500:
 *         description: >
 *           Error interno. Si trae `transactionId`, el cobro sí se aprobó pero
 *           no se pudo guardar el pedido (hay que reembolsar a mano).
 */
router.route("/cobrar").post(verifyToken, wompiAppController.cobrar);

export default router;
