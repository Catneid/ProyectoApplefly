import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { config } from "../config.js";
import employeeModel from "../src/models/employees.js";

// Crea el primer admin con ADMIN_EMAIL / ADMIN_PASSWORD del .env.
// Es idempotente: si ya hay un empleado con ese correo, no toca nada.
const { email, password, name, lastName } = config.admin;

if (!email || !password) {
  console.error("Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en el .env");
  process.exit(1);
}

try {
  await mongoose.connect(config.db.URI);

  const existing = await employeeModel.findOne({ email });
  if (existing) {
    console.log(
      existing.role === "admin"
        ? `Ya existe un admin con el correo ${email}, no se hizo nada.`
        : `Ya existe un empleado con el correo ${email} pero su role es "${existing.role}"; no se modificó.`
    );
  } else {
    await employeeModel.create({
      name,
      lastName,
      email,
      password: await bcryptjs.hash(password, 10),
      role: "admin",
    });
    console.log(`Admin creado con el correo ${email}`);
  }
} catch (error) {
  console.error("Error al crear el admin:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
