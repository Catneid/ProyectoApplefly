import { Schema, model } from "mongoose";

const employeeSchema = new Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    salary: { type: Number },
    DUI: { type: String },
    phone: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "empleado"], default: "empleado" },
  },
  { timestamps: true, strict: false }
);

export default model("Employees", employeeSchema);
