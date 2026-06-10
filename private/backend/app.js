import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import limiter from "./src/middlewares/limiter.js";

import registerCustomerRoutes from "./src/routes/registerCustomer.js";
import loginCustomerRoutes from "./src/routes/loginCustomer.js";
import loginAdminRoutes from "./src/routes/loginAdmin.js";
import logoutRoutes from "./src/routes/logout.js";
import productsRoutes from "./src/routes/products.js";
import categoriesRoutes from "./src/routes/categories.js";
import employeesRoutes from "./src/routes/employees.js";
import customersRoutes from "./src/routes/customers.js";
import ordersRoutes from "./src/routes/orders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/registerCustomers", limiter, registerCustomerRoutes);
app.use("/api/loginCustomers", limiter, loginCustomerRoutes);
app.use("/api/loginAdmin", limiter, loginAdminRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);

export default app;
