import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import customerModel from "../models/customers.js";
import { config } from "../../config.js";

const registerCustomerController = {};

registerCustomerController.register = async (req, res) => {
  const { name, lastName, birthdate, email, password } = req.body;

  try {
    const existCustomer = await customerModel.findOne({ email });
    if (existCustomer) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const verificationCode = crypto.randomBytes(3).toString("hex");

    const tokenCode = jsonwebtoken.sign(
      { email, verificationCode, name, lastName, birthdate, passwordHash },
      config.JWT.secret,
      { expiresIn: "15m" }
    );

    res.cookie("verificationToken", tokenCode, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.email.user_email, pass: config.email.user_password },
    });

    const mailOptions = {
      from: config.email.user_email,
      to: email,
      subject: "Verifica tu cuenta en Applefly",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
          <h2 style="color:#1c1c1e">¡Bienvenido a Applefly!</h2>
          <p>Tu código de verificación es:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0071e3;text-align:center;padding:16px;background:#f5f5f7;border-radius:8px">${verificationCode}</div>
          <p style="color:#666;font-size:13px">Expira en 15 minutos.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log("Error enviando correo:", error);
        return res.status(500).json({ message: "Error al enviar correo de verificación" });
      }
      res.status(200).json({ message: "Código enviado, verifica tu correo" });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

registerCustomerController.verifyCode = async (req, res) => {
  try {
    const { verificationCodeRequest } = req.body;
    const token = req.cookies.verificationToken;

    if (!token) {
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    const { email, verificationCode, name, lastName, birthdate, passwordHash } = decoded;

    if (verificationCodeRequest !== verificationCode) {
      return res.status(400).json({ message: "Código incorrecto" });
    }

    const newCustomer = new customerModel({
      name,
      lastName,
      birthdate,
      email,
      password: passwordHash,
      isVerified: true,
      loginAttemps: 0,
    });

    await newCustomer.save();
    res.clearCookie("verificationToken");

    return res.status(200).json({ message: "Cuenta verificada exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default registerCustomerController;
