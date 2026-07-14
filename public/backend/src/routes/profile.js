import express from "express";
import profileController from "../controller/profileController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router
  .route("/")
  .get(verifyToken, profileController.getProfile)
  .put(verifyToken, profileController.updateProfile);

router.route("/password").put(verifyToken, profileController.changePassword);

export default router;
