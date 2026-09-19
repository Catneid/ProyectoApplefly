import app from "./app.js";
import "./database.js";

async function main() {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT);
  console.log("Servidor Applefly (tienda) en puerto " + PORT);
}

main();
