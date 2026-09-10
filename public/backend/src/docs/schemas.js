/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 660f1b2e8a1e4c001f8e4a10
 *         name:
 *           type: string
 *           example: Ana
 *         lastName:
 *           type: string
 *           example: Martínez
 *         email:
 *           type: string
 *           format: email
 *           example: ana@ejemplo.com
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         birthdate:
 *           type: string
 *           format: date
 *         isVerified:
 *           type: boolean
 *     Category:
 *      type: object
 *      properties:
 *        id:
 *           type: string
 *        name:
 *           type: string
 *           example: iPhone
 *        description:
 *           type: string
 *        image:
 *           type: string
 *           format: uri
 *     Product:
 *      type: object
 *      properties:
 *        id:
 *           type: string
 *        name:
 *           type: string
 *           example: iPhone 15 Pro
 *        description:
 *           type: string
 *        price:
 *           type: number
 *           example: 999.99
 *        originalPrice:
 *           type: number
 *        discount:
 *           type: number
 *        stock:
 *           type: integer
 *        category:
 *           type: object
 *           description: Poblado con populate("category", "name")
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *        image:
 *           type: string
 *           format: uri
 *        condition:
 *           type: string
 *           enum: [Nuevo, Reacondicionado]
 *        storage:
 *           type: string
 *        ram:
 *           type: string
 *        color:
 *           type: string
 *        featured:
 *           type: boolean
 *        rating:
 *           type: number
 *           description: Promedio calculado a partir de las reseñas (no se guarda en BD)
 *           example: 4.5
 *        reviews:
 *           type: integer
 *           description: Cantidad de reseñas (calculado, no se guarda en BD)
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Mensaje de error
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Operación exitosa
 */