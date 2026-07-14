import mongoose from "mongoose";
import { config } from "./config.js";

mongoose.connect(config.db.URI);

const connection = mongoose.connection;

connection.once("open", () => console.log("DB conectada (tienda)"));
connection.on("disconnected", () => console.log("DB desconectada (tienda)"));
connection.on("error", (err) => console.log("Error DB: " + err));
