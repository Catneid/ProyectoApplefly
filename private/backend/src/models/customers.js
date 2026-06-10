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
    isVerified: { type: Boolean, default: false },
    loginAttemps: { type: Number, default: 0 },
    timeOut: { type: Date },
  },
  { timestamps: true, strict: false }
);

export default model("Customers", customerSchema);
