import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import fetch from "node-fetch";
import customerModel from "../models/customers.js";
import { config } from "../../config.js";
import { authCookieOptions } from "../utils/cookieOptions.js";
import { TOKEN_TYP } from "../utils/tokenTypes.js";
import { esCorreo } from "../utils/validaciones.js";

const loginCustomerController = {};

const FIREBASE_API = "https://identitytoolkit.googleapis.com/v1/accounts";

const llamarFirebase = async (accion, cuerpo) => {
  const respuesta = await fetch(`${FIREBASE_API}:${accion}?key=${config.firebase.webApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  return respuesta.ok ? respuesta.json() : null;
};

// Respaldo cuando la contraseña no matchea en Mongo: puede ser que el
// cliente la haya cambiado desde la app (Firebase) y acá todavía quedó la
// vieja. Es la mitad "app -> web" del puente de cuentas compartidas; la
// mitad opuesta (Mongo como respaldo cuando falla Firebase) vive en
// mobile/src/context/AuthContext.jsx.
//
// CUIDADO: Firebase deja crear una cuenta con CUALQUIER correo sin verificar
// que sea suyo. Si bastara con que signInWithPassword acepte la contraseña,
// alguien podría crear en Firebase una cuenta con el correo de otra persona,
// "iniciar sesión" ahí y que este respaldo le cambiara la contraseña de la
// cuenta de la web. Por eso solo se acepta si ADEMÁS:
//   (a) la cuenta de Firebase que entró es la que está vinculada a ESTE cliente
//       (localId == firebaseUid), no una homónima; y
//   (b) Firebase confirma que ese correo está verificado (accounts:lookup).
// Si algo no cuadra, se trata como contraseña incorrecta.
const passwordValidaEnFirebase = async (cliente, password) => {
  if (!config.firebase.webApiKey || !cliente.firebaseUid) return false;

  try {
    const inicio = await llamarFirebase("signInWithPassword", {
      email: cliente.email,
      password,
      returnSecureToken: true,
    });
    if (!inicio || inicio.localId !== cliente.firebaseUid || !inicio.idToken) return false;

    const consulta = await llamarFirebase("lookup", { idToken: inicio.idToken });
    const cuenta = consulta?.users?.[0];

    return (
      cuenta?.localId === cliente.firebaseUid &&
      cuenta.emailVerified === true &&
      String(cuenta.email).toLowerCase() === String(cliente.email).toLowerCase()
    );
  } catch (error) {
    console.log("No se pudo validar la contraseña contra Firebase:", error.message);
    return false;
  }
};

// Cuando el correo no existe se compara igual la contraseña contra este hash de
// relleno (mismo costo que uno real), para que la respuesta tarde parecido y no
// delate si la cuenta existe.
const HASH_FALSO = bcrypt.hashSync("hash-de-relleno-para-igualar-tiempos", 10);

// Mismo mensaje para "no existe" y "contraseña incorrecta".
const CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

loginCustomerController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Texto, no objetos: un { "$ne": null } en el correo llegaría a la consulta
    // de Mongo como operador. Y bcrypt.compare con algo que no es texto tira.
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son requeridos" });
    }
    if (!esCorreo(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    const userFound = await customerModel.findOne({ email });

    // El bcrypt se hace SIEMPRE, con la cuenta real o con el hash de relleno
    const isMatch = await bcrypt.compare(password, userFound?.password ?? HASH_FALSO);

    if (!userFound) {
      return res.status(401).json({ message: CREDENCIALES_INCORRECTAS });
    }

    if (userFound.timeOut && userFound.timeOut > Date.now()) {
      return res.status(403).json({ message: "Cuenta bloqueada temporalmente. Intenta en 15 minutos" });
    }

    if (!isMatch) {
      const validaEnFirebase = await passwordValidaEnFirebase(userFound, password);

      if (validaEnFirebase) {
        // La cambió desde la app y acá todavía teníamos la vieja: la
        // sincronizamos y seguimos el login como si isMatch hubiera dado
        // true desde el principio (mismo reset de intentos más abajo).
        userFound.password = await bcrypt.hash(password, 10);
      } else {
        userFound.loginAttemps = (userFound.loginAttemps || 0) + 1;

        if (userFound.loginAttemps >= 5) {
          userFound.timeOut = Date.now() + 15 * 60 * 1000;
          userFound.loginAttemps = 0;
          await userFound.save();
          return res.status(403).json({ message: "Cuenta bloqueada por 15 minutos" });
        }

        await userFound.save();
        return res.status(401).json({ message: CREDENCIALES_INCORRECTAS });
      }
    }

    // Recién con la contraseña correcta se dice que falta verificar el correo:
    // antes, ese mensaje le confirmaba a cualquiera que la cuenta existe.
    if (!userFound.isVerified) {
      return res.status(403).json({ message: "Debes verificar tu correo primero" });
    }

    userFound.loginAttemps = 0;
    userFound.timeOut = null;
    await userFound.save();

    const token = jsonwebtoken.sign(
      { typ: TOKEN_TYP.SESSION, id: userFound._id, userType: "customer", name: userFound.name, email: userFound.email },
      config.JWT.secret,
      { expiresIn: "30d" }
    );

    res.cookie("authCookie", token, { ...authCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      message: "Login exitoso",
      user: { id: userFound._id, name: userFound.name, email: userFound.email },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


loginCustomerController.verify = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

export default loginCustomerController;
