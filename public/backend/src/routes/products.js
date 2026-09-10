import express from "express";
import productsController from "../controller/productsController.js";

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Catálogo]
 *     summary: Lista todos los productos del catálogo, con su valoración promedio
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").get(productsController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Catálogo]
 *     summary: Obtiene un producto por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de Mongo del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/:id").get(productsController.getProductById);

export default router;
