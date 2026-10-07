import { Schema, model } from "mongoose";

// Mensajes del formulario de contacto de la app. Nadie los lee desde el
// cliente; se revisan directo en la base.
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default model("ContactMessages", contactMessageSchema);
