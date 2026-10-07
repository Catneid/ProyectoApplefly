import nodemailer from "nodemailer";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import customerModel from "../models/customers.js";
import HTMLVerificationEmail from "../utils/sendMailVerification.js";
import {
  MAX_ATTEMPTS, generateCode, newCodeId, hashCode, compareCode, registerAttempt,
} from "../utils/verificationCode.js";
import { authCookieOptions } from "../utils/cookieOptions.js";
import { TOKEN_TYP } from "../utils/tokenTypes.js";
import { esCorreo } from "../utils/validaciones.js";
import { config } from "../../config.js";

const registerCustomerController = {};

registerCustomerController.register = async (req, res) => {
  const { name, lastName, birthdate, email, password } = req.body;

  try {
    // Todo texto: un objeto en el correo llegaría a la consulta de Mongo como
    // operador, y bcrypt.hash con algo que no es texto tira un error.
    if (!esCorreo(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }
    if (typeof password !== "string" || !password) {
      return res.status(400).json({ message: "La contraseña es requerida" });
    }
    if (typeof name !== "string" || typeof lastName !== "string") {
      return res.status(400).json({ message: "El nombre y el apellido son requeridos" });
    }

    const existCustomer = await customerModel.findOne({ email });
    if (existCustomer) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const verificationCode = generateCode();

    // En el token solo va el hash del código; el código en claro únicamente
    // viaja por correo.
    const tokenCode = jsonwebtoken.sign(
      { typ: TOKEN_TYP.VERIFY_EMAIL, email, codeHash: await hashCode(verificationCode), name, lastName, birthdate, passwordHash },
      config.JWT.secret,
      { expiresIn: "15m", jwtid: newCodeId() }
    );

    // httpOnly + sameSite + secure, las mismas de la cookie de sesión; los
    // clearCookie de abajo usan authCookieOptions para que el navegador la borre.
    res.cookie("verificationToken", tokenCode, { ...authCookieOptions, maxAge: 15 * 60 * 1000 });

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
      res.clearCookie("verificationToken", authCookieOptions);
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }

    // Solo vale un token de registro: ni una sesión ni un token de recuperación
    // (firmados con el mismo secreto) pueden pasar por acá.
    if (decoded.typ !== TOKEN_TYP.VERIFY_EMAIL) {
      res.clearCookie("verificationToken", authCookieOptions);
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }
    const { email, codeHash, jti, exp, name, lastName, birthdate, passwordHash } = decoded;

    if (!codeHash || !jti) {
      return res.status(400).json({ message: "Sesión expirada, regístrate de nuevo" });
    }

    // El intento se cuenta en la base antes de comparar (ver verificationCode.js)
    const attempts = await registerAttempt(jti, exp);

    const tooManyAttempts = () => {
      res.clearCookie("verificationToken", authCookieOptions);
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
    res.clearCookie("verificationToken", authCookieOptions);

    return res.status(200).json({ message: "Cuenta verificada exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Vincula una cuenta de la web (Mongo) con el usuario de Firebase de la app.
// Para cuentas que se registraron en la web: en la app se crean en Firebase
// con el mismo correo pero SIN verificarlo, así que verifyToken no puede
// vincularlas por correo (Firebase deja crear cuentas con cualquier correo; si
// bastara con coincidir, cualquiera podría quedarse con una cuenta ajena).
// Acá la prueba de que son la misma persona es la contraseña de la cuenta de
// la web. Usa los mismos contadores de intentos y bloqueo que el login, para
// que no sirva para adivinar contraseñas.
//
// Todos los fallos responden IGUAL (mismo status, mismo mensaje y un bcrypt
// de por medio), exista o no la cuenta de la web, esté vinculada a otro o
// bloqueada: si no, este endpoint serviría para averiguar qué correos están
// registrados.
const HASH_FALSO = bcryptjs.hashSync("hash-de-relleno-para-igualar-tiempos", 10);

registerCustomerController.linkFirebaseAccount = async (req, res) => {
  const noSePudo = () =>
    res.status(401).json({ message: "No se pudo vincular la cuenta. Revisa tu contraseña." });

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

    // Ya vinculada con ESTE usuario de Firebase: nada que probar ni revelar
    if (customer && customer.firebaseUid === req.uidApp) {
      return res.status(200).json({ message: "Cuenta vinculada" });
    }

    // El bcrypt se hace siempre, con la cuenta real o con un hash de relleno,
    // para que tampoco el tiempo de respuesta delate si existe.
    const coincide = await bcryptjs.compare(password, customer?.password ?? HASH_FALSO);

    if (!customer || customer.firebaseUid) return noSePudo();
    if (customer.timeOut && customer.timeOut > Date.now()) return noSePudo();

    if (!coincide) {
      customer.loginAttemps = (customer.loginAttemps || 0) + 1;

      if (customer.loginAttemps >= 5) {
        customer.timeOut = Date.now() + 15 * 60 * 1000;
        customer.loginAttemps = 0;
      }

      await customer.save();
      return noSePudo();
    }

    customer.loginAttemps = 0;
    customer.timeOut = null;
    customer.firebaseUid = req.uidApp;

    try {
      await customer.save();
    } catch (error) {
      // Este uid ya está vinculado a otro cliente de Mongo
      if (error?.code === 11000) return noSePudo();
      throw error;
    }

    return res.status(200).json({ message: "Cuenta vinculada" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default registerCustomerController;
