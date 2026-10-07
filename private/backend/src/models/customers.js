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
    // uid de Firebase Auth si el cliente usa la app (lo vincula public/backend).
    // Sirve para encontrar su push token en Firestore.
    firebaseUid: { type: String },
  },
  { timestamps: true, strict: false }
);

export default model("Customers", customerSchema);
