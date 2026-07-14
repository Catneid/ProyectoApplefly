import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import limiter from "./src/middlewares/limiter.js";

import loginAdminRoutes from "./src/routes/loginAdmin.js";
import logoutRoutes from "./src/routes/logout.js";
import productsRoutes from "./src/routes/products.js";
import categoriesRoutes from "./src/routes/categories.js";
import employeesRoutes from "./src/routes/employees.js";
import customersRoutes from "./src/routes/customers.js";
import ordersRoutes from "./src/routes/orders.js";

const app = express();

app.use(
  cors({
    // Este backend es solo del panel de administración.
    // La tienda del cliente (5173) habla con public/backend, en el puerto 4001.
    origin: ["http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/loginAdmin", limiter, loginAdminRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);

export default app;
