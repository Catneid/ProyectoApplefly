import jsonwebtoken from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; 
import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";
import {
  MAX_ATTEMPTS, generateCode, newCodeId, hashCode, compareCode, registerAttempt, consumeCode,
} from "../utils/verificationCode.js";
import { authCookieOptions } from "../utils/cookieOptions.js";
import { TOKEN_TYP } from "../utils/tokenTypes.js";
import { esCorreo } from "../utils/validaciones.js";

import { config } from "../../config.js";

import customerModel from "../models/customers.js";
import recoveryRequestModel from "../models/recoveryRequests.js";

const recoveryPasswordController = {};

// httpOnly + sameSite + secure, las mismas de la cookie de sesión. clearCookie
// tiene que usar exactamente las mismas opciones con las que se creó, si no el
// navegador no la borra.
const COOKIE_OPTIONS = { ...authCookieOptions, maxAge: 15 * 60 * 1000 };
const CLEAR_OPTIONS = authCookieOptions;

const EXPIRADO = "El código expiró, solicítalo de nuevo";

// Lee y valida la cookie de recuperación. Devuelve el token decodificado, o
// null si falta, está vencida, está manipulada o NO es un token de recuperación
// (por ejemplo, una sesión o un token de registro pegados acá).
const leerCookieRecuperacion = (req) => {
  const token = req.cookies.recoveryCookie;
  if (!token) return null;

  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    return decoded.typ === TOKEN_TYP.RECOVERY ? decoded : null;
  } catch {
    return null;
  }
};

// Misma respuesta exista o no el correo, para que nadie pueda usar este
// endpoint para averiguar qué correos tienen cuenta.
const GENERIC_MESSAGE = "Si el correo está registrado, te enviamos un código";

// Máximo de códigos por correo y por hora. El limiter por IP no alcanza: con
// muchas IPs se puede llenar de correos la bandeja de alguien, o gastar la
// cuota de envío del servidor de correo.
const MAX_CODIGOS_POR_HORA = 3;
const HORA_MS = 60 * 60 * 1000;

// Anota este pedido y dice si ya se pasó del límite. Cuenta TODOS los correos
// válidos, existan o no, para que no sirva para averiguar cuáles existen. Los
// pedidos que se pasan del límite no cuentan (se borran): si no, quien insista
// dejaría a la víctima sin poder recuperar su cuenta por tiempo indefinido.
//
// Se anota PRIMERO y se cuenta DESPUÉS: así, aunque lleguen muchas peticiones
// a la vez, a lo sumo MAX_CODIGOS_POR_HORA ven un total dentro del límite.
const superaLimitePorCorreo = async (email) => {
  const clave = email.trim().toLowerCase();

  const registro = await recoveryRequestModel.create({ email: clave });
  const pedidos = await recoveryRequestModel.countDocuments({
    email: clave,
    createdAt: mongoose.trusted({ $gt: new Date(Date.now() - HORA_MS) }),
  });

  if (pedidos <= MAX_CODIGOS_POR_HORA) return false;

  await recoveryRequestModel.deleteOne({ _id: registro._id });
  return true;
};

recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!esCorreo(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    const limitado = await superaLimitePorCorreo(email);

    const userFound = await customerModel.findOne({ email });

    // Si el correo no existe (o ya se llegó al límite por hora) se firma igual
    // una cookie con un hash de un código que nunca se envía a nadie: la
    // respuesta (cuerpo, cookie y tiempo) es indistinguible de la de un correo
    // real con código enviado.
    const code = generateCode();

    const token = jsonwebtoken.sign(
      { typ: TOKEN_TYP.RECOVERY, email, codeHash: await hashCode(code), userType: "customer", verified: false },
      config.JWT.secret,
      { expiresIn: "15m", jwtid: newCodeId() }
    );

    res.cookie("recoveryCookie", token, COOKIE_OPTIONS);

    if (limitado) {
      console.log("[recovery] Límite de códigos por hora alcanzado para un correo, no se envía otro");
    }

    if (userFound && !limitado) {
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

    const decoded = leerCookieRecuperacion(req);
    if (!decoded || decoded.verified || !decoded.codeHash || !decoded.jti) {
      res.clearCookie("recoveryCookie", CLEAR_OPTIONS);
      return res.status(400).json({ message: EXPIRADO });
    }

    const attempts = await registerAttempt(decoded.jti, decoded.exp);

    const tooManyAttempts = () => {
      res.clearCookie("recoveryCookie", CLEAR_OPTIONS);
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

    // Un código vale para una sola verificación: sin esto, quien tenga la
    // cookie y el código podría sacar tokens "verified" nuevos hasta que expire.
    if (!(await consumeCode(decoded.jti, decoded.exp))) {
      res.clearCookie("recoveryCookie", CLEAR_OPTIONS);
      return res.status(400).json({ message: EXPIRADO });
    }

    // El token "verified" lleva su propio jti para poder marcarlo como usado
    // en newPassword.
    const newToken = jsonwebtoken.sign(
      { typ: TOKEN_TYP.RECOVERY, email: decoded.email, userType: "customer", verified: true },
      config.JWT.secret,
      { expiresIn: "15m", jwtid: newCodeId() }
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

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    // Cookie ausente, vencida, manipulada o de otro tipo: todo es "expiró"
    const decoded = leerCookieRecuperacion(req);
    if (!decoded || !decoded.jti) {
      return res.status(400).json({ message: EXPIRADO });
    }

    if (!decoded.verified) {
      return res.status(400).json({ message: "Primero debes verificar el código" });
    }

    // De un solo uso y de forma atómica: se marca ANTES de cambiar la
    // contraseña, así dos peticiones simultáneas con la misma cookie no pueden
    // cambiarla las dos, ni se puede reutilizar después.
    if (!(await consumeCode(decoded.jti, decoded.exp))) {
      res.clearCookie("recoveryCookie", CLEAR_OPTIONS);
      return res.status(400).json({ message: EXPIRADO });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await customerModel.findOneAndUpdate(
      { email: decoded.email },
      { password: passwordHash, loginAttemps: 0, timeOut: null }
    );

    res.clearCookie("recoveryCookie", CLEAR_OPTIONS);

    return res.status(200).json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default recoveryPasswordController;
