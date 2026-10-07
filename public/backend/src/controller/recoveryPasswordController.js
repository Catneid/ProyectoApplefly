import jsonwebtoken from "jsonwebtoken"; 
import bcrypt from "bcryptjs"; 
import nodemailer from "nodemailer"; 
import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";
import {
  MAX_ATTEMPTS, generateCode, newCodeId, hashCode, compareCode, registerAttempt,
} from "../utils/verificationCode.js";

import { config } from "../../config.js";

import customerModel from "../models/customers.js";

const recoveryPasswordController = {};

const COOKIE_OPTIONS = { maxAge: 15 * 60 * 1000, httpOnly: true };

// Misma respuesta exista o no el correo, para que nadie pueda usar este
// endpoint para averiguar qué correos tienen cuenta.
const GENERIC_MESSAGE = "Si el correo está registrado, te enviamos un código";

recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    const userFound = await customerModel.findOne({ email });

    // Si el correo no existe se firma igual una cookie con un hash de un
    // código que nunca se envía a nadie: la respuesta (cuerpo, cookie y
    // tiempo) es indistinguible de la de un correo real.
    const code = generateCode();

    const token = jsonwebtoken.sign(
      { email, codeHash: await hashCode(code), userType: "customer", verified: false },
      config.JWT.secret,
      { expiresIn: "15m", jwtid: newCodeId() }
    );

    res.cookie("recoveryCookie", token, COOKIE_OPTIONS);

    if (userFound) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.email.user_email,
          pass: config.email.user_password,
        },
      });

      // Sin await a propósito: esperar al SMTP haría que responder tarde
      // delatara que el correo sí existe.
      transporter
        .sendMail({
          from: config.email.user_email,
          to: email,
          subject: "Recupera tu contraseña de Applefly",
          html: HTMLRecoveryEmail(code),
        })
        .catch((error) => console.log("error al enviar correo de recuperación: " + error));
    }

    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


recoveryPasswordController.verifyCode = async (req, res) => {
  try {
    const { codeRequest } = req.body;

    const token = req.cookies.recoveryCookie;
    if (!token) {
      return res.status(400).json({ message: "El código expiró, solicítalo de nuevo" });
    }

    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, config.JWT.secret);
    } catch {
      res.clearCookie("recoveryCookie");
      return res.status(400).json({ message: "El código expiró, solicítalo de nuevo" });
    }

    if (decoded.verified || !decoded.codeHash || !decoded.jti) {
      return res.status(400).json({ message: "El código expiró, solicítalo de nuevo" });
    }

    const attempts = await registerAttempt(decoded.jti, decoded.exp);

    const tooManyAttempts = () => {
      res.clearCookie("recoveryCookie");
      return res.status(429).json({
        code: "TOO_MANY_ATTEMPTS",
        message: "Demasiados intentos fallidos, solicita un código nuevo",
      });
    };

    if (attempts > MAX_ATTEMPTS) return tooManyAttempts();

    if (!(await compareCode(codeRequest, decoded.codeHash))) {
      if (attempts === MAX_ATTEMPTS) return tooManyAttempts();
      return res.status(400).json({
        message: `Código incorrecto, te quedan ${MAX_ATTEMPTS - attempts} intentos`,
      });
    }

    const newToken = jsonwebtoken.sign(
      { email: decoded.email, userType: "customer", verified: true },
      config.JWT.secret,
      { expiresIn: "15m" }
    );

    res.cookie("recoveryCookie", newToken, COOKIE_OPTIONS);

    return res.status(200).json({ message: "Código verificado correctamente" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


recoveryPasswordController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    const token = req.cookies.recoveryCookie;
    if (!token) {
      return res.status(400).json({ message: "El código expiró, solicítalo de nuevo" });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);


    if (!decoded.verified) {
      return res.status(400).json({ message: "Primero debes verificar el código" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await customerModel.findOneAndUpdate(
      { email: decoded.email },
      { password: passwordHash, loginAttemps: 0, timeOut: null },
      { new: true }
    );

    res.clearCookie("recoveryCookie");

    return res.status(200).json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default recoveryPasswordController;
