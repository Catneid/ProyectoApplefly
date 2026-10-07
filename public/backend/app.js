import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./src/swagger.js";

import { loginLimiter, registerLimiter, recoveryLimiter } from "./src/middlewares/limiter.js";

import registerCustomerRoutes from "./src/routes/registerCustomer.js";
import loginCustomerRoutes from "./src/routes/loginCustomer.js";
import logoutRoutes from "./src/routes/logout.js";
import recoveryPasswordRoutes from "./src/routes/recoveryPassword.js";
import productsRoutes from "./src/routes/products.js";
import categoriesRoutes from "./src/routes/categories.js";
import ordersRoutes from "./src/routes/orders.js";
import contactRoutes from "./src/routes/contact.js";
import reviewsRoutes from "./src/routes/reviews.js";
import profileRoutes from "./src/routes/profile.js";

const app = express();

// Estos servicios corren detrás del proxy de Render. Sin esto, req.ip es la IP
// del proxy para TODOS los clientes y los limiters los cuentan como una sola
// persona (30 peticiones entre todos). El 1 es "confía en un solo salto": se
// usa la IP que agregó el proxy y no una X-Forwarded-For inventada por el cliente.
app.set("trust proxy", 1);

app.use(
  cors({
    // Solo la tienda del cliente consume este backend
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Los limiters solo van en las rutas de autenticación, para no estorbar la
// navegación del catálogo. Cada ruta tiene el suyo: no comparten contador.
app.use("/api/registerCustomers", registerLimiter, registerCustomerRoutes);
app.use("/api/loginCustomers", loginLimiter, loginCustomerRoutes);
app.use("/api/recoveryPassword", recoveryLimiter, recoveryPasswordRoutes);
app.use("/api/logout", logoutRoutes);

app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profile", profileRoutes);

export default app;
