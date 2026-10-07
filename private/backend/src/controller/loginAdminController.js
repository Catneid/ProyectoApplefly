import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import employeeModel from "../models/employees.js";
import { config } from "../../config.js";
import { adminCookieOptions } from "../utils/cookieOptions.js";
import { TOKEN_TYP } from "../utils/tokenTypes.js";
import { esCorreo } from "../utils/validaciones.js";

const loginAdminController = {};

// Cuando el correo no existe se compara igual la contraseña contra este hash de
// relleno (mismo costo que uno real).
const HASH_FALSO = bcrypt.hashSync("hash-de-relleno-para-igualar-tiempos", 10);

const CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

loginAdminController.login = async (req, res) => {
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

    const employee = await employeeModel.findOne({ email });

    // El bcrypt se hace SIEMPRE, con la cuenta real o con el hash de relleno,
    // para que la respuesta tarde parecido exista o no el empleado.
    const isMatch = await bcrypt.compare(password, employee?.password ?? HASH_FALSO);

    // Mismo mensaje para "no existe" y "contraseña incorrecta"
    if (!employee || !isMatch) {
      return res.status(401).json({ message: CREDENCIALES_INCORRECTAS });
    }

    const token = jsonwebtoken.sign(
      { typ: TOKEN_TYP.ADMIN_SESSION, id: employee._id, userType: "admin", name: employee.name, email: employee.email, role: employee.role },
      config.JWT.secret,
      { expiresIn: "8h" }
    );

    res.cookie("adminAuthCookie", token, {
      ...adminCookieOptions,
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login admin exitoso",
      user: { id: employee._id, name: employee.name, email: employee.email, role: employee.role },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// El token solo dice quién era el empleado al iniciar sesión (hasta hace 8 h).
// Acá se lee de la base: si lo borraron la sesión deja de valer, y si le
// cambiaron el rol el panel recibe el actual, no el que quedó en el token.
loginAdminController.verify = async (req, res) => {
  try {
    const employee = await employeeModel.findById(req.user.id).select("name email role");

    if (!employee) {
      res.clearCookie("adminAuthCookie", adminCookieOptions);
      return res.status(401).json({ message: "Sesión inválida" });
    }

    return res.status(200).json({
      user: { id: employee._id, name: employee.name, email: employee.email, role: employee.role },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default loginAdminController;
