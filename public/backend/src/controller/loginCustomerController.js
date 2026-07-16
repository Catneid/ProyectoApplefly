import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import customerModel from "../models/customers.js";
import { config } from "../../config.js";

const loginCustomerController = {};

loginCustomerController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFound = await customerModel.findOne({ email });
    if (!userFound) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!userFound.isVerified) {
      return res.status(403).json({ message: "Debes verificar tu correo primero" });
    }

    if (userFound.timeOut && userFound.timeOut > Date.now()) {
      return res.status(403).json({ message: "Cuenta bloqueada temporalmente. Intenta en 15 minutos" });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);

    if (!isMatch) {
      userFound.loginAttemps = (userFound.loginAttemps || 0) + 1;

      if (userFound.loginAttemps >= 5) {
        userFound.timeOut = Date.now() + 15 * 60 * 1000;
        userFound.loginAttemps = 0;
        await userFound.save();
        return res.status(403).json({ message: "Cuenta bloqueada por 15 minutos" });
      }

      await userFound.save();
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    userFound.loginAttemps = 0;
    userFound.timeOut = null;
    await userFound.save();

    const token = jsonwebtoken.sign(
      { id: userFound._id, userType: "customer", name: userFound.name, email: userFound.email },
      config.JWT.secret,
      { expiresIn: "30d" }
    );

    res.cookie("authCookie", token, { maxAge: 30 * 24 * 60 * 60 * 1000 });

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
