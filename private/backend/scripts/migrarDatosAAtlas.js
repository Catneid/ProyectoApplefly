/**
 * Script de un solo uso: copia todas las colecciones de la base local a
 * MongoDB Atlas, conservando los _id (para que no se rompan las referencias
 * entre pedidos, clientes, productos y categorías).
 *
 * Uso:
 *   node scripts/migrarDatosAAtlas.js "<uri-origen>" "<uri-destino>"
 *
 * Ejemplo:
 *   node scripts/migrarDatosAAtlas.js "mongodb://localhost:27017/Applefly_DB" "mongodb+srv://user:pass@cluster.mongodb.net/Applefly_DB"
 *
 * Importante: correr PRIMERO migrarImagenesACloudinary.js, para que los
 * productos que se copien ya lleven la URL de Cloudinary y no una ruta local.
 */
import { MongoClient } from "mongodb";

const [, , uriOrigen, uriDestino] = process.argv;

if (!uriOrigen || !uriDestino) {
  console.error("Uso: node scripts/migrarDatosAAtlas.js \"<uri-origen>\" \"<uri-destino>\"");
  process.exit(1);
}

const main = async () => {
  const origen = new MongoClient(uriOrigen);
  const destino = new MongoClient(uriDestino);

  await origen.connect();
  await destino.connect();

  const dbOrigen = origen.db();
  const dbDestino = destino.db();

  console.log(`Origen : ${dbOrigen.databaseName}`);
  console.log(`Destino: ${dbDestino.databaseName}\n`);

  const colecciones = await dbOrigen.listCollections().toArray();

  for (const { name } of colecciones) {
    const documentos = await dbOrigen.collection(name).find().toArray();

    if (documentos.length === 0) {
      console.log(`${name}: vacía, nada que copiar`);
      continue;
    }

    // Vaciamos la colección destino para que el script se pueda repetir
    // sin duplicar documentos ni chocar con _id ya existentes.
    await dbDestino.collection(name).deleteMany({});
    await dbDestino.collection(name).insertMany(documentos);

    const copiados = await dbDestino.collection(name).countDocuments();
    console.log(`${name}: ${copiados} documentos copiados`);
  }

  await origen.close();
  await destino.close();
  console.log("\nMigración a Atlas terminada.");
};

main().catch((error) => {
  console.error("Falló la migración:", error.message);
  process.exit(1);
});
