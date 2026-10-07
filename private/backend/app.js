import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import loginAdminRoutes from "./src/routes/loginAdmin.js";
import logoutRoutes from "./src/routes/logout.js";
import productsRoutes from "./src/routes/products.js";
import categoriesRoutes from "./src/routes/categories.js";
import employeesRoutes from "./src/routes/employees.js";
import customersRoutes from "./src/routes/customers.js";
import ordersRoutes from "./src/routes/orders.js";

const app = express();

// Corre detrás del proxy de Render. Sin esto, req.ip es la IP del proxy para
// TODOS los clientes y el limiter del login los cuenta como una sola persona.
// TRUST_PROXY es cuántos saltos de proxy se confían: 1 = solo Render (por
// defecto). El panel en Vercel reenvía /api hasta acá (Vercel -> Render), así
// que en Render conviene poner 2 para que cada admin cuente con su propia IP.
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

// El panel en Vercel llama a /api en su propio dominio (vercel.json reenvía a
// Render), así que en producción el navegador no hace peticiones cruzadas.
// CORS_ORIGINS queda por si se llama al backend directo desde otro dominio,
// separado por comas.
const origenesPermitidos = [
  "http://localhost:5174",
  ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(
  cors({
    // Este backend es solo del panel de administración.
    // La tienda del cliente (5173) habla con public/backend, en el puerto 4001.
    origin: origenesPermitidos,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/loginAdmin", loginAdminRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);

export default app;
