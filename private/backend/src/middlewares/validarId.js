import mongoose from "mongoose";

// Para router.param("id", validarId): si el :id de la ruta no tiene forma de
// ObjectId, el recurso no existe (404). Sin esto, Mongo falla al convertirlo y
// el error termina como un 500.
export const validarId = (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "No encontrado" });
  }
  next();
};
