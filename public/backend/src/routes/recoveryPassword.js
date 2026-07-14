import express from "express";
import recoveryPasswordController from "../controller/recoveryPasswordController.js";

const router = express.Router();

router.route("/requestCode").post(recoveryPasswordController.requestCode);
router.route("/verifyCode").post(recoveryPasswordController.verifyCode);
router.route("/newPassword").post(recoveryPasswordController.newPassword);

export default router;
