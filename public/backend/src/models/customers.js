import { Schema, model } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String },
    lastName: { type: String },
    birthdate: { type: Date },
    email: { type: String, unique: true },
    password: { type: String },
    phone: { type: String },
    address: { type: String },
    // Foto de perfil de la app (URL de Cloudinary). La sube POST /profile/app/foto
    photoURL: { type: String },
    isVerified: { type: Boolean, default: false },
    loginAttemps: { type: Number, default: 0 },
    timeOut: { type: Date },
    // uid de Firebase Auth, para clientes que usan la app mobile. Único pero
    // "sparse": los clientes que solo usan la web no lo tienen. Nunca se debe
    // guardar null/"" (el índice los trataría como un valor repetido).
    firebaseUid: { type: String, unique: true, sparse: true },
  },
  { timestamps: true, strict: false }
);

export default model("Customers", customerSchema);
