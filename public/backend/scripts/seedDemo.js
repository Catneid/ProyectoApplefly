// Datos de demostración para la API: clientes de prueba con historial de
// pedidos y reseñas, sobre los productos que YA hay en la base.
//
//   npm run seed:demo                         crea lo que falte (idempotente)
//   npm run seed:demo -- --dry-run            muestra qué haría, sin escribir nada
//   npm run seed:demo -- --agotado "<nombre o id>"
//                                             además deja ese producto con stock 0
//   npm run seed:demo -- --reset              borra SOLO lo creado por el demo
//   npm run seed:demo -- --reset --dry-run    muestra qué borraría
//
// Usa la misma DB_URI del .env y la clave de Firebase Admin de
// src/config/firebaseAdmin.js. Todo lo que crea lleva demo: true, y con eso
// --reset sabe qué es suyo (nunca toca clientes, pedidos ni reseñas reales).
//
// Los pedidos son históricos: NO descuentan stock. Las credenciales de los
// clientes se escriben en scripts/demoUsers.md (ignorado por git), no en la consola.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

import { config } from "../config.js";
import { getFirebaseAuth } from "../src/config/firebaseAdmin.js";
import customerModel from "../src/models/customers.js";
import orderModel from "../src/models/orders.js";
import productModel from "../src/models/products.js";
import reviewModel from "../src/models/reviews.js";
import { calcularTotales } from "../src/utils/precios.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO_CREDENCIALES = path.join(__dirname, "demoUsers.md");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const RESET = args.includes("--reset");
const indiceAgotado = args.indexOf("--agotado");
const AGOTADO = indiceAgotado >= 0 ? args[indiceAgotado + 1] : null;

// ---------------------------------------------------------------------------
// Datos fijos de los clientes y de los comentarios
// ---------------------------------------------------------------------------
const CLIENTES = [
  { email: "demo1@applefly.test", name: "Camila", lastName: "Hernández", birthdate: "1996-03-14", phone: "7345-1290", address: "Colonia Escalón, calle 5, casa 12, San Salvador" },
  { email: "demo2@applefly.test", name: "Diego", lastName: "Martínez", birthdate: "1991-09-02", phone: "7612-8845", address: "Residencial Los Pinos, pasaje 3, casa 8, Santa Tecla" },
  { email: "demo3@applefly.test", name: "Valeria", lastName: "Rivas", birthdate: "2001-11-25", phone: "6987-3321", address: "Colonia Médica, avenida 2, apartamento 4B, San Salvador" },
];

// Cuántos pedidos tiene cada cliente (2 o 3) y qué calificación da a sus dos reseñas
const PEDIDOS_POR_CLIENTE = [3, 2, 3];
const RATINGS = [[5, 4], [3, 5], [4, 2]];

// Plantillas por calificación; {p} es el nombre del producto
const COMENTARIOS = {
  5: [
    "Excelente, el {p} llegó en perfecto estado y mucho antes de lo esperado. Muy recomendado.",
    "Superó mis expectativas. El {p} funciona de maravilla y la entrega fue rapidísima.",
    "Muy buena compra, el {p} es tal cual la descripción. Volvería a comprar sin dudarlo.",
  ],
  4: [
    "Muy bueno el {p}, cumple con todo lo que prometía. Solo le bajo una estrella porque la caja llegó algo golpeada.",
    "Buen producto, el {p} funciona muy bien y el precio es justo. La entrega tardó un día más de lo previsto.",
  ],
  3: [
    "El {p} está bien, pero esperaba un poco más por lo que pagué. Cumple, aunque sin sorprender.",
    "Producto aceptable. El {p} funciona, pero la batería me dura menos de lo que decían.",
  ],
  2: [
    "No quedé del todo conforme con el {p}: llegó con algunos rayones leves. La atención fue buena, pero esperaba mejor estado.",
  ],
};

const DIAS_ATRAS = { min: 2, max: 60 };

// ---------------------------------------------------------------------------
// Aleatoriedad determinista: el mismo catálogo da siempre el mismo plan, así
// que lo que muestra --dry-run es exactamente lo que se crea después.
// ---------------------------------------------------------------------------
const semilla = (n) => () => {
  n |= 0; n = (n + 0x6d2b79f5) | 0;
  let t = Math.imul(n ^ (n >>> 15), 1 | n);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1));
const barajar = (rnd, lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const fechaHaceDias = (ahora, dias, rnd) => {
  const f = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
  f.setHours(entre(rnd, 9, 20), entre(rnd, 0, 59), entre(rnd, 0, 59), 0);
  return f;
};

// ---------------------------------------------------------------------------
// Plan: qué se va a crear (puro, no escribe nada)
// ---------------------------------------------------------------------------
const construirUnPlan = (productos, ahora, valorSemilla) => {
  const rnd = semilla(valorSemilla);
  const pedidos = [];

  CLIENTES.forEach((cliente, i) => {
    const cantidad = PEDIDOS_POR_CLIENTE[i];
    // Los días se reparten en tramos iguales entre hace 60 y hace 2 días
    const tramo = (DIAS_ATRAS.max - DIAS_ATRAS.min) / PEDIDOS_POR_CLIENTE.length;

    for (let k = 0; k < cantidad; k++) {
      const desde = Math.round(DIAS_ATRAS.max - (k + i / 3) * tramo * (3 / cantidad));
      const dias = Math.max(DIAS_ATRAS.min, entre(rnd, Math.max(DIAS_ATRAS.min, desde - 8), desde));
      const lineas = barajar(rnd, productos)
        .slice(0, entre(rnd, 1, 3))
        .map((p) => {
          const quantity = entre(rnd, 1, 2);
          return { productId: p._id, name: p.name, price: p.price, quantity, subtotal: p.price * quantity };
        });

      const totales = calcularTotales(lineas.reduce((s, l) => s + l.subtotal, 0));
      pedidos.push({
        cliente: i,
        dias,
        creado: fechaHaceDias(ahora, dias, rnd),
        lineas,
        ...totales,
        transactionId: `DEMO-${crypto.createHash("sha1").update(`${i}-${k}-${dias}`).digest("hex").slice(0, 10).toUpperCase()}`,
        status: "entregado",
      });
    }
  });

  // Un solo pedido "enviado": el más reciente de la primera cliente, de hace 3 días
  const deLaPrimera = pedidos.filter((p) => p.cliente === 0).sort((a, b) => a.dias - b.dias)[0];
  deLaPrimera.dias = 3;
  deLaPrimera.creado = fechaHaceDias(ahora, 3, rnd);
  deLaPrimera.status = "enviado";

  pedidos.sort((a, b) => b.creado - a.creado);

  // Reseñas: 2 por cliente, de productos de pedidos ENTREGADOS suyos. Entre
  // todas las combinaciones posibles se elige la que reseña más productos
  // distintos (que las reseñas queden repartidas, no todas en el mismo).
  const comprasPorCliente = CLIENTES.map((_, i) => {
    const comprados = [];
    for (const pedido of pedidos.filter((p) => p.cliente === i && p.status === "entregado")) {
      for (const l of pedido.lineas) {
        if (!comprados.some((c) => String(c.productId) === String(l.productId))) comprados.push({ ...l, pedido });
      }
    }
    return comprados;
  });

  const pares = (lista) => {
    const salida = [];
    for (let a = 0; a < lista.length; a++) for (let b = a + 1; b < lista.length; b++) salida.push([lista[a], lista[b]]);
    return salida.length > 0 ? salida : lista.map((x) => [x]);
  };
  const opciones = comprasPorCliente.map(pares);

  let mejor = { distintos: -1, eleccion: [] };
  const probar = (i, eleccion) => {
    if (i === opciones.length) {
      const distintos = new Set(eleccion.flat().map((c) => String(c.productId))).size;
      if (distintos > mejor.distintos) mejor = { distintos, eleccion };
      return;
    }
    for (const opcion of opciones[i]) probar(i + 1, [...eleccion, opcion]);
  };
  probar(0, []);

  const resenas = [];
  mejor.eleccion.forEach((elegidos, i) => {
    elegidos.forEach((c, j) => {
      const rating = RATINGS[i][j];
      const plantillas = COMENTARIOS[rating];
      const comentario = plantillas[(i + j) % plantillas.length].replace("{p}", c.name);
      // La reseña llega unos días después del pedido, sin pasar de "ahora"
      const despues = Math.min(ahora.getTime(), c.pedido.creado.getTime() + entre(rnd, 2, 9) * 24 * 60 * 60 * 1000);
      resenas.push({ cliente: i, productId: c.productId, producto: c.name, rating, comment: comentario, creado: new Date(despues) });
    });
  });

  return { pedidos, resenas, distintos: mejor.distintos };
};

// La rúbrica pide reseñas en al menos 6 productos: si con una combinación de
// pedidos no se llega, se prueba otra (determinista, así que el plan es siempre
// el mismo para el mismo catálogo).
export const construirPlan = (productos, ahora = new Date()) => {
  let ultimo;
  for (let intento = 0; intento < 200; intento++) {
    ultimo = construirUnPlan(productos, ahora, 20260507 + intento);
    if (ultimo.distintos >= 6 || productos.length < 6) return ultimo;
  }
  return ultimo;
};

// ---------------------------------------------------------------------------
// Salida legible
// ---------------------------------------------------------------------------
const dinero = (n) => `$${n.toFixed(2)}`;
const fecha = (d) => d.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" });

const imprimirPlan = (plan, estado, productoAgotado) => {
  console.log("\n=== QUÉ CREARÍA EL DEMO ===\n");

  console.log(`Clientes (${CLIENTES.length}) — contraseña común, correo verificado, también en Firebase Auth:`);
  CLIENTES.forEach((c, i) => {
    const marca = estado.clientes[i] ? " (ya existe: se deja igual)" : "";
    console.log(`  ${i + 1}. ${c.email} · ${c.name} ${c.lastName} · nac. ${c.birthdate} · ${c.phone}${marca}`);
  });

  console.log(`\nPedidos (${plan.pedidos.length}), sin descontar stock, pago Wompi aprobado (tarjeta ••••0693):`);
  plan.pedidos.forEach((p) => {
    const lineas = p.lineas.map((l) => `${l.quantity}× ${l.name}`).join(", ");
    console.log(`  ${fecha(p.creado)} · ${CLIENTES[p.cliente].name} · ${p.status.padEnd(9)} · ${dinero(p.total)} · ${lineas}`);
  });
  const nuevosPedidos = estado.pedidos.some(Boolean) ? " (los clientes que ya tienen pedidos demo no se tocan)" : "";
  console.log(`  Total: ${plan.pedidos.filter((p) => p.status === "entregado").length} entregados, ${plan.pedidos.filter((p) => p.status === "enviado").length} enviado.${nuevosPedidos}`);

  console.log(`\nReseñas (${plan.resenas.length}), solo de productos que ese cliente compró y le entregaron:`);
  plan.resenas.forEach((r) => {
    console.log(`  ${CLIENTES[r.cliente].name} → ${r.producto} · ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} · "${r.comment}"`);
  });
  console.log(`  Productos distintos con reseñas: ${new Set(plan.resenas.map((r) => String(r.productId))).size}`);

  if (productoAgotado) {
    console.log(`\nStock 0: "${productoAgotado.name}" pasaría de ${productoAgotado.stock} a 0 (se guarda el valor original para --reset).`);
  } else {
    console.log("\nStock 0: ningún producto (falta indicar cuál con --agotado).");
  }

  console.log(`\nLa base es: ${config.db.URI.replace(/\/\/[^@]*@/, "//***@").split("?")[0]}`);
};

// ---------------------------------------------------------------------------
// Firebase Auth
// ---------------------------------------------------------------------------
const asegurarUsuarioFirebase = async (cliente, password) => {
  const auth = getFirebaseAuth();
  try {
    const existente = await auth.getUserByEmail(cliente.email);
    await auth.updateUser(existente.uid, { password, emailVerified: true, displayName: `${cliente.name} ${cliente.lastName}` });
    return existente.uid;
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }
  const creado = await auth.createUser({
    email: cliente.email,
    password,
    emailVerified: true,
    displayName: `${cliente.name} ${cliente.lastName}`,
  });
  return creado.uid;
};

// ---------------------------------------------------------------------------
// Contraseña común: se conserva la de demoUsers.md; si no hay, se genera una
// ---------------------------------------------------------------------------
const leerPasswordGuardada = () => {
  try {
    return fs.readFileSync(ARCHIVO_CREDENCIALES, "utf8").match(/Contraseña común:\s*`([^`]+)`/)?.[1] ?? null;
  } catch {
    return null;
  }
};
const generarPassword = () => `Demo-${crypto.randomBytes(6).toString("base64url")}`;

const escribirCredenciales = (password) => {
  const filas = CLIENTES.map((c) => `| ${c.email} | ${c.name} ${c.lastName} |`).join("\n");
  fs.writeFileSync(
    ARCHIVO_CREDENCIALES,
    `# Clientes de demostración

Generado por \`npm run seed:demo\`. **No se sube a git** (está en .gitignore).
Sirven para entrar a la app y a la web sin verificar el correo.

Contraseña común: \`${password}\`

| Correo | Cliente |
|---|---|
${filas}
`
  );
};

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
const reset = async () => {
  const clientes = await customerModel.collection.find({ demo: true }).toArray();
  const ids = clientes.map((c) => c._id);
  const pedidos = await orderModel.collection.countDocuments({ demo: true });
  const resenas = await reviewModel.collection.countDocuments({ demo: true });
  const productosConStock = await productModel.collection.find({ demoStockOriginal: { $exists: true } }).toArray();

  console.log(`\n=== ${DRY ? "BORRARÍA" : "BORRANDO"} LO CREADO POR EL DEMO ===`);
  console.log(`  Clientes demo: ${clientes.length} (${clientes.map((c) => c.email).join(", ") || "-"})`);
  console.log(`  Pedidos demo: ${pedidos}`);
  console.log(`  Reseñas demo: ${resenas}`);
  console.log(`  Usuarios de Firebase: ${clientes.filter((c) => c.firebaseUid).length}`);
  productosConStock.forEach((p) => {
    console.log(`  Stock de "${p.name}": ${p.stock} → ${p.stock === 0 ? p.demoStockOriginal : `${p.stock} (ya cambió, se deja)`}`);
  });
  if (DRY) return;

  await reviewModel.collection.deleteMany({ demo: true });
  await orderModel.collection.deleteMany({ demo: true });

  for (const c of clientes) {
    if (!c.firebaseUid) continue;
    try {
      await getFirebaseAuth().deleteUser(c.firebaseUid);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") console.log(`  No se pudo borrar ${c.email} de Firebase:`, error.code || error.message);
    }
  }
  await customerModel.collection.deleteMany({ _id: { $in: ids }, demo: true });

  for (const p of productosConStock) {
    // Solo se restaura si sigue en 0: si alguien ya lo repuso a mano, se respeta
    if (p.stock === 0) await productModel.collection.updateOne({ _id: p._id }, { $set: { stock: p.demoStockOriginal }, $unset: { demoStockOriginal: "" } });
    else await productModel.collection.updateOne({ _id: p._id }, { $unset: { demoStockOriginal: "" } });
  }

  try {
    fs.unlinkSync(ARCHIVO_CREDENCIALES);
  } catch {
    // ya no estaba
  }
  console.log("\nListo.");
};

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
const resolverProductoAgotado = (productos) => {
  if (!AGOTADO) return null;
  const buscado = AGOTADO.trim().toLowerCase();
  const exactos = productos.filter((p) => String(p._id) === AGOTADO.trim() || p.name.toLowerCase() === buscado);
  const candidatos = exactos.length > 0 ? exactos : productos.filter((p) => p.name.toLowerCase().includes(buscado));
  if (candidatos.length !== 1) {
    throw new Error(
      candidatos.length === 0
        ? `--agotado: no hay ningún producto que coincida con "${AGOTADO}"`
        : `--agotado: "${AGOTADO}" coincide con varios (${candidatos.map((p) => p.name).join(", ")}); usa el nombre completo o el id`
    );
  }
  return candidatos[0];
};

const main = async () => {
  await mongoose.connect(config.db.URI);

  try {
    if (RESET) {
      await reset();
      return;
    }

    const todos = await productModel.collection.find({}).sort({ _id: 1 }).toArray();
    // Un producto sin precio (price 0) no sirve para un pedido de ejemplo
    const productos = todos.filter((p) => p.price > 0);
    if (productos.length === 0) throw new Error("No hay productos con precio en la base: el demo se apoya en los que ya existen.");
    const sinPrecio = todos.filter((p) => !(p.price > 0));

    const plan = construirPlan(productos);
    // El producto agotado puede ser cualquiera del catálogo, tenga o no precio
    const productoAgotado = resolverProductoAgotado(todos);

    // Qué existe ya (para no duplicar)
    const estado = { clientes: [], pedidos: [], resenas: [] };
    for (const [i, c] of CLIENTES.entries()) {
      const existente = await customerModel.collection.findOne({ email: c.email });
      if (existente && !existente.demo) {
        throw new Error(`${c.email} ya existe y NO fue creado por el demo: no se toca. Cambia el correo del demo o bórralo a mano.`);
      }
      estado.clientes[i] = existente ?? null;
      estado.pedidos[i] = existente ? (await orderModel.collection.countDocuments({ customerId: existente._id, demo: true })) > 0 : false;
      estado.resenas[i] = existente ? (await reviewModel.collection.countDocuments({ customerId: existente._id, demo: true })) > 0 : false;
    }

    if (sinPrecio.length > 0) {
      console.log(`Aviso: se ignoran para los pedidos ${sinPrecio.length} producto(s) sin precio: ${sinPrecio.map((p) => `"${p.name.trim()}"`).join(", ")}`);
    }
    imprimirPlan(plan, estado, productoAgotado);
    if (DRY) {
      console.log("\n(--dry-run: no se escribió nada)");
      return;
    }

    // --- escribir
    const guardada = leerPasswordGuardada();
    const password = guardada ?? generarPassword();
    const hash = await bcryptjs.hash(password, 10);
    const ids = [];

    for (const [i, c] of CLIENTES.entries()) {
      const uid = await asegurarUsuarioFirebase(c, password);
      const existente = estado.clientes[i];

      if (existente) {
        // Ya estaba: solo se alinean la contraseña (si cambió) y el uid de Firebase
        await customerModel.collection.updateOne({ _id: existente._id }, { $set: { firebaseUid: uid, password: hash, isVerified: true } });
        ids[i] = existente._id;
        continue;
      }

      const _id = new mongoose.Types.ObjectId();
      await customerModel.collection.insertOne({
        _id,
        name: c.name,
        lastName: c.lastName,
        birthdate: new Date(`${c.birthdate}T06:00:00.000Z`),
        email: c.email,
        password: hash,
        phone: c.phone,
        address: c.address,
        isVerified: true,
        loginAttemps: 0,
        firebaseUid: uid,
        demo: true,
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        __v: 0,
      });
      ids[i] = _id;
    }

    const nuevosPedidos = plan.pedidos.filter((p) => !estado.pedidos[p.cliente]);
    if (nuevosPedidos.length > 0) {
      await orderModel.collection.insertMany(
        nuevosPedidos.map((p) => ({
          customerId: ids[p.cliente],
          customerName: `${CLIENTES[p.cliente].name} ${CLIENTES[p.cliente].lastName}`,
          customerEmail: CLIENTES[p.cliente].email,
          products: p.lineas,
          subtotal: p.subtotal,
          shipping: p.shipping,
          tax: p.tax,
          total: p.total,
          status: p.status,
          address: CLIENTES[p.cliente].address,
          phone: CLIENTES[p.cliente].phone,
          stockDevuelto: false,
          payment: { method: "wompi", transactionId: p.transactionId, status: "aprobado", cardLast4: "0693" },
          demo: true,
          createdAt: p.creado,
          updatedAt: p.creado,
          __v: 0,
        }))
      );
    }

    const nuevasResenas = plan.resenas.filter((r) => !estado.resenas[r.cliente]);
    if (nuevasResenas.length > 0) {
      await reviewModel.collection.insertMany(
        nuevasResenas.map((r) => ({
          productId: r.productId,
          customerId: ids[r.cliente],
          customerName: CLIENTES[r.cliente].name,
          rating: r.rating,
          comment: r.comment,
          demo: true,
          createdAt: r.creado,
          updatedAt: r.creado,
          __v: 0,
        }))
      );
    }

    if (productoAgotado) {
      // Solo la primera vez guarda el stock original (si ya estaba en 0 por el demo, no lo pisa)
      await productModel.collection.updateOne(
        { _id: productoAgotado._id, demoStockOriginal: { $exists: false } },
        { $set: { stock: 0, demoStockOriginal: productoAgotado.stock } }
      );
    }

    escribirCredenciales(password);
    console.log(`\nListo: ${nuevosPedidos.length} pedidos y ${nuevasResenas.length} reseñas nuevos.`);
    console.log("Correos y contraseña en public/backend/scripts/demoUsers.md");
  } finally {
    await mongoose.disconnect();
  }
};

// Se exporta para poder esperar a que termine (lo usan las pruebas)
export const terminado = main().catch((error) => {
  console.error("\nError:", error.message);
  process.exit(1);
});
