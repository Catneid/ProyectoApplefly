import mongoose from "mongoose";
import { config } from "./config.js";

// Defensa contra inyección NoSQL: un objeto con operadores que llegue desde el
// cliente (p. ej. { "email": { "$ne": null } }) deja de interpretarse como
// operador en los filtros. Los filtros propios que sí necesitan operadores
// ($gte, $ne, $exists...) se marcan con mongoose.trusted().
mongoose.set("sanitizeFilter", true);

mongoose.connect(config.db.URI);

const connection = mongoose.connection;

connection.once("open", () => console.log("DB conectada (tienda)"));
connection.on("disconnected", () => console.log("DB desconectada (tienda)"));
connection.on("error", (err) => console.log("Error DB: " + err));
