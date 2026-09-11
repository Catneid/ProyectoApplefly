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

// Alta de clientes que se registran desde la app mobile (Firebase Auth).
// A diferencia de /register, acá no hay código por correo: la verificación
// la maneja Firebase (manda su propio link), así que la cuenta se crea de
// una. Es la mitad "mobile -> web" del puente de cuentas compartidas; la
// otra mitad (web -> mobile) vive en mobile/src/context/AuthContext.jsx.
registerCustomerController.registerFromMobile = async (req, res) => {
  const { name, lastName, birthdate, email, password, phone, address, firebaseUid } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son requeridos" });
    }

    // verifyFirebaseToken ya validó el ID token y dejó el uid real en
    // req.uidApp. Si no coincide con el firebaseUid que manda el body,
    // alguien está intentando registrar una cuenta a nombre de otro uid.
    if (req.uidApp !== firebaseUid) {
      return res.status(403).json({ message: "No coincide la sesión con la cuenta que intentás registrar" });
    }

    const existCustomer = await customerModel.findOne({ email });
    if (existCustomer) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newCustomer = new customerModel({
      name,
      lastName,
      birthdate,
      email,
      password: passwordHash,
      phone,
      address,
      isVerified: true,
      loginAttemps: 0,
      firebaseUid,
    });

    await newCustomer.save();

    return res.status(201).json({ message: "Cuenta creada", id: newCustomer._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default registerCustomerController;
