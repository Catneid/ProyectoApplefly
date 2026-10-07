import express from "express";
import loginAdminController from "../controller/loginAdminController.js";
import { verifyAdmin } from "../middlewares/verifyToken.js";
import limiter from "../middlewares/limiter.js";

const router = express.Router();

router.get("/verify", verifyAdmin, loginAdminController.verify);
// El limiter es contra la fuerza bruta del login: va solo en POST /. /verify lo
// llama el panel en cada carga y no puede gastar los intentos del login.
router.post("/", limiter, loginAdminController.login);

export default router;
