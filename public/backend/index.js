import app from "./app.js";
import "./database.js";

async function main() {
  app.listen(4001);
  console.log("Servidor Applefly (tienda) en puerto 4001");
}

main();
