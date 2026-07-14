import jsonwebtoken from "jsonwebtoken"; // Crear el token
import bcrypt from "bcryptjs"; // Encriptar la nueva contraseña
import crypto from "crypto"; // Generar el código aleatorio
import nodemailer from "nodemailer"; // Enviar el correo
import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";

import { config } from "../../config.js";

import customerModel from "../models/customers.js";

const recoveryPasswordController = {};

// PASO 1 - Solicitar el código por correo electrónico
recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    const userFound = await customerModel.findOne({ email });
    if (!userFound) {
      return res.status(404).json({ message: "No existe una cuenta con ese correo" });
    }

    // Generar el código aleatorio
    const code = crypto.randomBytes(3).toString("hex");

    // El código viaja firmado dentro de la cookie, no en la base de datos
    const token = jsonwebtoken.sign(
      { email, code, userType: "customer", verified: false },
      config.JWT.secret,
      { expiresIn: "15m" }
    );

    res.cookie("recoveryCookie", token, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
      },
    });

    const mailOptions = {
      from: config.email.user_email,
      to: email,
      subject: "Recupera tu contraseña de Applefly",
      html: HTMLRecoveryEmail(code),
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Código enviado, revisa tu correo" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error al enviar el correo" });
  }
};

// PASO 2 - Verificar el código que escribió el usuario
recoveryPasswordController.verifyCode = async (req, res) => {
  try {
    const { codeRequest } = req.body;

    const token = req.cookies.recoveryCookie;
    if (!token) {
      return res.status(400).json({ message: "El código expiró, solicítalo de nuevo" });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (codeRequest !== decoded.code) {
      return res.status(400).json({ message: "Código incorrecto" });
    }

    // Marcamos en el token que el código ya fue verificado, para que el
    // paso 3 sepa que esta persona sí tiene permiso de cambiar la contraseña
    const newToken = jsonwebtoken.sign(
      { email: decoded.email, userType: "customer", verified: true },
      config.JWT.secret,
      { expiresIn: "15m" }
    );

    res.cookie("recoveryCookie", newToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json({ message: "Código verificado correctamente" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PASO 3 - Guardar la nueva contraseña
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

    // Sin haber pasado por el paso 2 no se puede cambiar nada
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
