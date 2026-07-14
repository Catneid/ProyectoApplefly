import bcrypt from "bcryptjs";
import customerModel from "../models/customers.js";

const profileController = {};

// Datos del cliente que está en sesión. Nunca se devuelve la contraseña.
profileController.getProfile = async (req, res) => {
  try {
    const customer = await customerModel.findById(req.user.id).select("-password");
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    return res.status(200).json(customer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

profileController.updateProfile = async (req, res) => {
  try {
    const { name, lastName, phone, address, birthdate } = req.body;

    // Solo estos campos son editables: el correo no se cambia (es la
    // identidad de la cuenta) y la contraseña tiene su propio endpoint.
    const updated = await customerModel
      .findByIdAndUpdate(
        req.user.id,
        { name, lastName, phone, address, birthdate },
        { new: true }
      )
      .select("-password");

    if (!updated) return res.status(404).json({ message: "Cliente no encontrado" });

    return res.status(200).json({ message: "Perfil actualizado", customer: updated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

profileController.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const customer = await customerModel.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    // Pedimos la contraseña actual para que nadie que se siente en una
    // sesión abierta pueda secuestrar la cuenta.
    const coincide = await bcrypt.compare(currentPassword, customer.password);
    if (!coincide) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    return res.status(200).json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default profileController;
