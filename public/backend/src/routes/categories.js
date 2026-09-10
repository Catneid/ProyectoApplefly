import express from "express";
import categoriesController from "../controller/categoriesController.js";

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Catálogo]
 *     summary: Lista todas las categorías del catálogo
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").get(categoriesController.getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Catálogo]
 *     summary: Obtiene una categoría por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de Mongo de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/:id").get(categoriesController.getCategoryById);

export default router;
