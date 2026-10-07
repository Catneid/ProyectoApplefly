import nodemailer from "nodemailer";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import customerModel from "../models/customers.js";
import HTMLVerificationEmail from "../utils/sendMailVerification.js";
import {
  MAX_ATTEMPTS, generateCode, newCodeId, hashCode, compareCode, registerAttempt,
} from "../utils/verificationCode.js";
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
    const verificationCode = generateCode();

    // En el token solo va el hash del código; el código en claro únicamente
    // viaja por correo.
    const tokenCode = jsonwebtoken.sign(
      { email, codeHash: await hashCode(verificationCode), name, lastName, birthdate, passwordHash },
      config.JWT.secret,
      { expiresIn: "15m", jwtid: newCodeId() }
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

    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, config.JWT.secret);
    } catch {
      res.clearCookie("verificationToken");
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }
    const { email, codeHash, jti, exp, name, lastName, birthdate, passwordHash } = decoded;

    if (!codeHash || !jti) {
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }

    // El intento se cuenta en la base antes de comparar (ver verificationCode.js)
    const attempts = await registerAttempt(jti, exp);

    const tooManyAttempts = () => {
      res.clearCookie("verificationToken");
      return res.status(429).json({
        code: "TOO_MANY_ATTEMPTS",
        message: "Demasiados intentos fallidos, regístrate de nuevo para recibir un código nuevo",
      });
    };

    if (attempts > MAX_ATTEMPTS) return tooManyAttempts();

    if (!(await compareCode(verificationCodeRequest, codeHash))) {
      if (attempts === MAX_ATTEMPTS) return tooManyAttempts();
      return res.status(400).json({
        message: `Código incorrecto, te quedan ${MAX_ATTEMPTS - attempts} intentos`,
      });
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

// Vincula una cuenta de la web (Mongo) con el usuario de Firebase de la app.
// Para cuentas que se registraron en la web: en la app se crean en Firebase
// con el mismo correo pero SIN verificarlo, así que verifyToken no puede
// vincularlas por correo. Acá la prueba de que son la misma persona es la
// contraseña de la cuenta de la web. Usa los mismos contadores de intentos y
// bloqueo que el login, para que no sirva para adivinar contraseñas.
registerCustomerController.linkFirebaseAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (typeof password !== "string" || !password) {
      return res.status(400).json({ message: "La contraseña es requerida" });
    }
    if (!req.emailApp) {
      return res.status(400).json({ message: "La cuenta de Firebase no tiene correo" });
    }

    const customer = await customerModel
      .findOne({ email: req.emailApp })
      .collation({ locale: "en", strength: 2 });

    if (!customer) {
      return res.status(404).json({ message: "No hay una cuenta de la web con ese correo" });
    }

    if (customer.firebaseUid === req.uidApp) {
      return res.status(200).json({ message: "Cuenta vinculada", id: customer._id });
    }

    if (customer.firebaseUid) {
      return res.status(409).json({ message: "Esa cuenta ya está vinculada a otro usuario de la app" });
    }

    if (customer.timeOut && customer.timeOut > Date.now()) {
      return res.status(403).json({ message: "Cuenta bloqueada temporalmente. Intenta en 15 minutos" });
    }

    if (!(await bcryptjs.compare(password, customer.password))) {
      customer.loginAttemps = (customer.loginAttemps || 0) + 1;

      if (customer.loginAttemps >= 5) {
        customer.timeOut = Date.now() + 15 * 60 * 1000;
        customer.loginAttemps = 0;
        await customer.save();
        return res.status(403).json({ message: "Cuenta bloqueada por 15 minutos" });
      }

      await customer.save();
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    customer.loginAttemps = 0;
    customer.timeOut = null;
    customer.firebaseUid = req.uidApp;

    try {
      await customer.save();
    } catch (error) {
      // Este uid ya está vinculado a otro cliente de Mongo
      if (error?.code === 11000) {
        return res.status(409).json({ message: "Tu usuario de la app ya está vinculado a otra cuenta" });
      }
      throw error;
    }

    return res.status(200).json({ message: "Cuenta vinculada", id: customer._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default registerCustomerController;
