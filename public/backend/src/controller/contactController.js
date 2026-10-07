import contactMessageModel from "../models/contactMessages.js";
import { texto } from "../utils/validaciones.js";

const contactController = {};

contactController.create = async (req, res) => {
  try {
    const name = texto(req.body.name, 100);
    const email = texto(req.body.email, 200);
    const message = texto(req.body.message, 2000);

    if (!name || !message) {
      return res.status(400).json({ message: "El nombre y el mensaje son requeridos" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "El correo no es válido" });
    }

    await contactMessageModel.create({ name, email, message });
    return res.status(201).json({ message: "Mensaje enviado, ¡gracias por escribirnos!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default contactController;
