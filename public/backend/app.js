import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import limiter from "./src/middlewares/limiter.js";

import registerCustomerRoutes from "./src/routes/registerCustomer.js";
import loginCustomerRoutes from "./src/routes/loginCustomer.js";
import logoutRoutes from "./src/routes/logout.js";
import recoveryPasswordRoutes from "./src/routes/recoveryPassword.js";
import productsRoutes from "./src/routes/products.js";
import categoriesRoutes from "./src/routes/categories.js";
import ordersRoutes from "./src/routes/orders.js";
import reviewsRoutes from "./src/routes/reviews.js";
import profileRoutes from "./src/routes/profile.js";
import wompiRoutes from "./src/routes/wompi.js";

const app = express();

app.use(
  cors({
    // Solo la tienda del cliente consume este backend
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// El limiter solo va en las rutas de autenticación, para no estorbar
// la navegación del catálogo.
app.use("/api/registerCustomers", limiter, registerCustomerRoutes);
app.use("/api/loginCustomers", limiter, loginCustomerRoutes);
app.use("/api/recoveryPassword", limiter, recoveryPasswordRoutes);
app.use("/api/logout", logoutRoutes);

app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wompi", wompiRoutes);

export default app;
