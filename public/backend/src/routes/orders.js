import express from "express";
import { validarId } from "../middlewares/validarId.js";
import ordersController from "../controller/ordersController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkoutLimiter } from "../middlewares/limiter.js";

const router = express.Router();

// Un id que no tiene forma de ObjectId no existe: 404 (no un 500 de Mongo)
router.param("id", validarId);

// Todo lo de pedidos exige sesión iniciada: no se puede comprar
// ni ver el historial sin haber entrado a la cuenta. La sesión puede ser la
// cookie de la web o un ID token de Firebase (app mobile).

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     tags: [Pedidos]
 *     summary: Paga y crea un pedido (único camino para comprar)
 *     description: >
 *       **Del cliente solo se usa QUÉ se compra** (`products`: productId y
 *       quantity), a dónde va y la tarjeta. Cualquier precio, subtotal, envío,
 *       IVA o total que se mande se ignora: el servidor lee cada producto de
 *       Mongo y calcula todo (envío $15, gratis desde $500; IVA 13%).
 *
 *       Orden: (1) calcula el total; (2) reserva el stock de forma atómica;
 *       (3) cobra ese total con Wompi usando el correo de la sesión; (4) si
 *       Wompi rechaza, devuelve el stock y responde 402; (5) si aprueba, crea
 *       el pedido con `payment: { method: "wompi", transactionId, status:
 *       "aprobado", cardLast4 }`. El pedido queda en estado `pendiente`.
 *
 *       Cada llamada a Wompi tiene un timeout de 20 segundos. Lo que se hace con
 *       el stock depende de si Wompi alcanzó a cobrar:
 *       - **Wompi rechaza** (`esAprobada: false`): se devuelve el stock y se
 *         responde 402 con el mensaje de Wompi.
 *       - **Falla el token o la tokenización** (todavía no se cobró): se devuelve
 *         el stock y se responde 502 "No se pudo procesar el pago, intenta de nuevo".
 *       - **Falla la red, hay timeout o la respuesta es ilegible DURANTE el cobro**
 *         (no se sabe si Wompi cobró): el stock NO se devuelve, se guarda un
 *         pedido en estado `pago-pendiente-revision` para conciliarlo a mano y se
 *         responde 502 con su referencia. El cliente no debe repetir la compra.
 *
 *       Los datos de la tarjeta nunca se guardan ni se registran.
 *     security:
 *       - cookieAuth: []
 *       - firebaseIdTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products, address, phone, tarjeta]
 *             properties:
 *               products:
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
 *                 description: Opcional. Si no viene se usa el nombre de la cuenta.
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
 *         description: Pago aprobado y pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Carrito, tarjeta o datos de envío inválidos, o un producto ya no está disponible
 *       401:
 *         description: Sin sesión
 *       402:
 *         description: Wompi rechazó el cobro (el stock se devolvió y no se creó ningún pedido)
 *       502:
 *         description: >
 *           No se pudo completar el pago. Con "intenta de nuevo", falló el token o
 *           la tokenización (no se cobró, el stock se devolvió). Con "No pudimos
 *           confirmar tu pago", falló la comunicación durante el cobro: puede
 *           haberse cobrado, el stock sigue reservado y el body trae `orderId`
 *           (pedido en estado `pago-pendiente-revision`).
 *       403:
 *         description: Correo de la app sin verificar
 *       409:
 *         description: No hay stock suficiente de algún producto (`product` y `available` en el body). No se cobró nada
 *       429:
 *         description: Demasiados intentos de pago
 *       500:
 *         description: >
 *           Error interno. Si trae `transactionId`, el cobro sí se aprobó pero
 *           no se pudo guardar el pedido (hay que reembolsar a mano).
 */
router.route("/checkout").post(checkoutLimiter, verifyToken, ordersController.checkout);

/**
 * @swagger
 * /orders/mis-pedidos:
 *   get:
 *     tags: [Pedidos]
 *     summary: Historial de pedidos del cliente con sesión
 *     security:
 *       - cookieAuth: []
 *       - firebaseIdTokenAuth: []
 *     responses:
 *       200:
 *         description: Pedidos del cliente, del más nuevo al más viejo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Sin sesión
 */
router.route("/mis-pedidos").get(verifyToken, ordersController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Un pedido propio
 *     security:
 *       - cookieAuth: []
 *       - firebaseIdTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: El pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Sin sesión
 *       403:
 *         description: El pedido es de otro cliente
 *       404:
 *         description: Pedido no encontrado
 */
router.route("/:id").get(verifyToken, ordersController.getMyOrderById);

export default router;
