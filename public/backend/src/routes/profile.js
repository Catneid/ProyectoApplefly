import express from "express";
import profileController from "../controller/profileController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyFirebaseToken } from "../middlewares/verifyFirebaseToken.js";
import { uploadFotoPerfilApp } from "../utils/cloudinaryConfig.js";

const router = express.Router();

router
  .route("/")
  .get(verifyToken, profileController.getProfile)
  .put(verifyToken, profileController.updateProfile);

router.route("/password").put(verifyToken, profileController.changePassword);

/**
 * @swagger
 * /profile/app/foto:
 *   post:
 *     tags: [Perfil - App móvil]
 *     summary: Sube la foto de perfil de la app a Cloudinary
 *     description: >
 *       No toca Mongo ni Firestore: solo sube la imagen y devuelve su
 *       secure_url. La app guarda esa URL en "users/{uid}".photoURL.
 *     security:
 *       - firebaseIdTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen subida
 *       400:
 *         description: Falta la imagen
 *       401:
 *         description: Falta el token de Firebase, o es inválido/expiró
 *       500:
 *         description: Error interno del servidor
 */
router
  .route("/app/foto")
  .post(verifyFirebaseToken, uploadFotoPerfilApp.single("photo"), profileController.uploadFotoApp);

export default router;
