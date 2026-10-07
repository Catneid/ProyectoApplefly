import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import customerModel from "../models/customers.js";
import {
  campoRequerido, leerNombre, leerTelefono, leerDireccion, leerFechaNacimiento,
} from "../utils/validaciones.js";
import { sincronizarPasswordEnFirebase } from "../utils/firebasePassword.js";

const profileController = {};


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

// Actualiza SOLO los campos que llegan (un campo ausente, null o vacío se
// ignora: nunca se guarda undefined ni un string vacío). Todo lo que llega se
// valida; si algo no sirve se responde 400 con el motivo y no se guarda nada.
const LECTORES = {
  name: (valor) => leerNombre(valor, "nombre"),
  lastName: (valor) => leerNombre(valor, "apellido"),
  phone: leerTelefono,
  address: leerDireccion,
  birthdate: leerFechaNacimiento,
};

profileController.updateProfile = async (req, res) => {
  try {
    const cambios = {};

    for (const [campo, leer] of Object.entries(LECTORES)) {
      const valor = req.body?.[campo];
      if (!campoRequerido(valor)) continue;

      const { valor: limpio, error } = leer(valor);
      if (error) return res.status(400).json({ message: error });
      cambios[campo] = limpio;
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ message: "No hay ningún dato válido para actualizar" });
    }

    const updated = await customerModel
      .findByIdAndUpdate(req.user.id, { $set: cambios }, { returnDocument: "after", runValidators: true })
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


    const coincide = await bcrypt.compare(currentPassword, customer.password);
    if (!coincide) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    // Misma contraseña en la app (Firebase); si falla solo queda en el log
    await sincronizarPasswordEnFirebase(customer, customer.email, newPassword);

    return res.status(200).json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

// Sube la foto de perfil de la app mobile a Cloudinary (carpeta
// "applefly/perfiles-app/{uid}", ver src/utils/cloudinaryConfig.js), guarda la
// URL en el cliente de Mongo (campo photoURL, que después devuelve
// GET /profile) y la devuelve. La app además la copia a Firestore
// ("users/{uid}".photoURL).
//
// El cliente se busca por firebaseUid, que verifyToken deja puesto en el primer
// uso de la API con el correo verificado. Si todavía no existe (correo sin
// verificar) o falla el guardado, la imagen recién subida se borra de
// Cloudinary para que no quede huérfana.
profileController.uploadFotoApp = async (req, res) => {
  const descartarImagen = async () => {
    try {
      if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename);
    } catch (error) {
      console.log("No se pudo borrar la imagen huérfana de Cloudinary:", error.message);
    }
  };

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Falta la imagen" });
    }

    const customer = await customerModel.findOneAndUpdate(
      { firebaseUid: req.uidApp },
      { $set: { photoURL: req.file.path } },
      { returnDocument: "after" }
    );

    if (!customer) {
      await descartarImagen();
      return res.status(403).json({ message: "Verifica tu correo para cambiar tu foto de perfil" });
    }

    return res.status(200).json({ secure_url: customer.photoURL });
  } catch (error) {
    console.log(error);
    await descartarImagen();
    return res.status(500).json({ message: "Error interno" });
  }
};

export default profileController;
