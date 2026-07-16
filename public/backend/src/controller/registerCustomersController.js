import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import customerModel from "../models/customers.js";
import HTMLVerificationEmail from "../utils/sendMailVerification.js";
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
      html: HTMLVerificationEmail(verificationCode),
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Código enviado, verifica tu correo" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al enviar el correo de verificación" });
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
