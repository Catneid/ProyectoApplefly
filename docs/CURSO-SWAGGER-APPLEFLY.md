# Curso: documenta la API de Applefly con Swagger (OpenAPI 3)

**Duración estimada:** 3h 30min – 4h, en 6 módulos con checkpoints de tiempo.
**Formato:** yo te explico y te doy el código exacto a escribir; tú lo escribes a mano en tu editor, en tu proyecto real (`D:\Applefly`). Cada módulo termina con un checkpoint para que verifiques que vas bien antes de seguir.
**Vas a tocar:** `public/backend` (la tienda, puerto 4001) y `private/backend` (el admin, puerto 4000).

> No necesitas saber nada de Swagger de antemano. Cada concepto se explica la primera vez que aparece, y luego solo se reutiliza.

---

## Antes de empezar: ¿qué es Swagger/OpenAPI?

Dos términos que la gente mezcla:

- **OpenAPI** es la *especificación*: un formato (JSON o YAML) para describir una API — qué rutas existen, qué reciben, qué devuelven, qué errores pueden dar. Es solo un documento, no corre código.
- **Swagger UI** es una *herramienta* que lee ese documento OpenAPI y dibuja una página web interactiva donde cualquiera puede ver los endpoints y probarlos con un botón "Try it out".

Cuando alguien dice "documentar con Swagger", casi siempre se refiere a: generar el documento OpenAPI + servirlo con Swagger UI.

### Dos formas de generarlo

1. **Contrato-primero:** escribes un archivo `openapi.yaml` gigante a mano, separado del código.
2. **Código-primero (la que usaremos):** escribes comentarios especiales (bloques `@swagger`) directamente encima de cada ruta, en tus archivos de rutas. Una librería (`swagger-jsdoc`) los lee y arma el documento OpenAPI automáticamente.

Elegimos la opción 2 porque tu API ya existe y tiene rutas bien organizadas (`src/routes/*.js`) — la documentación queda pegada al código, así que cuando cambies una ruta, la doc está justo ahí para actualizarla.

**Las dos librerías que instalaremos en cada backend:**
- `swagger-jsdoc`: lee tus comentarios `@swagger` y genera el JSON de OpenAPI.
- `swagger-ui-express`: sirve ese JSON como una página interactiva en una ruta tipo `/api-docs`.

### Anatomía de un documento OpenAPI (lo mínimo para arrancar)

```yaml
openapi: 3.0.3
info:
  title: Nombre de tu API
  version: 1.0.0
paths:
  /algo:
    get:
      summary: Qué hace este endpoint
      responses:
        200:
          description: Qué devuelve si todo sale bien
components:
  schemas:      # formas de tus objetos (Producto, Cliente, etc.) — se reutilizan con $ref
  securitySchemes:  # cómo se autentica (cookie, bearer token, etc.)
```

No necesitas memorizar esto. Lo iremos llenando pieza por pieza.

**⏱️ Si vas leyendo con calma, este bloque te toma ~20-25 min. Cuando lo tengas claro, seguimos.**

---

## Módulo 1 — Setup en `public/backend` (puerto 4001)

**Tiempo estimado: 30-35 min**

### 1.1 Instala las dependencias

Abre una terminal en `public/backend` y corre:

```bash
cd public/backend
npm install swagger-jsdoc swagger-ui-express
```

### 1.2 Crea el archivo de configuración base

Crea `public/backend/src/swagger.js` con esto:

```js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Applefly API — Tienda",
      version: "1.0.0",
      description:
        "API pública que consume el frontend de la tienda (clientes): catálogo, carrito, pedidos, reseñas, perfil y pagos con Wompi.",
    },
    servers: [
      { url: "http://localhost:4001/api", description: "Desarrollo local" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "authCookie",
          description:
            "Cookie httpOnly que se setea al hacer login en /loginCustomers. Contiene un JWT con { id, userType: 'customer', name, email }.",
        },
        recoveryCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "recoveryCookie",
          description:
            "Cookie temporal (15 min) del flujo de recuperación de contraseña. La crea POST /recoveryPassword/requestCode y la leen /verifyCode y /newPassword. No tiene relación con la sesión del cliente (authCookie) — es de un solo uso y expira sola.",
        },
        verificationTokenAuth: {
          type: "apiKey",
          in: "cookie",
          name: "verificationToken",
          description:
            "Cookie temporal (15 min) del flujo de registro. La crea POST /registerCustomers y la lee /registerCustomers/verifyCodeEmail. Tampoco tiene relación con authCookie.",
        },
      },
    },
  },
  // Dónde buscar los comentarios @swagger. Iremos agregando archivos
  // a esta lista a medida que documentemos cada grupo de rutas.
  apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
```

Aquí ya usamos un concepto clave: `securitySchemes.cookieAuth`. Le estamos diciendo a Swagger "esta API se autentica con una cookie llamada `authCookie`", así luego solo tenemos que escribir `security: [{ cookieAuth: [] }]` en cada ruta protegida en vez de repetir la explicación cada vez.

`apis` es la lista de archivos donde `swagger-jsdoc` va a buscar comentarios `@swagger`. Ya referenciamos una carpeta `src/docs/` que no existe todavía — la crearemos en el Módulo 2 para poner ahí los `schemas` reutilizables (Cliente, Producto, etc.), separados de las rutas.

### 1.3 Monta Swagger UI en tu app

Abre `public/backend/app.js` y agrega esto (no borres nada de lo que ya tienes, solo suma):

```js
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./src/swagger.js";
```

Y después de tus `app.use(express.json())` (antes de las rutas o donde prefieras), agrega:

```js
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 1.4 Checkpoint ✅

Corre `npm run dev` en `public/backend` y abre en el navegador:

```
http://localhost:4001/api-docs
```

Deberías ver la página de Swagger UI con el título "Applefly API — Tienda", pero **sin ningún endpoint listado todavía** — eso es correcto, porque aún no hemos escrito ningún comentario `@swagger`. Eso viene ahora.

Si la página no carga: revisa que el import de `swaggerSpec` tenga la ruta correcta (`./src/swagger.js`) y que el servidor no esté tirando un error en la consola.

---

## Módulo 2 — Documentando autenticación de clientes

**Tiempo estimado: 45-50 min**

Aquí aprendes la sintaxis real de un bloque `@swagger` y la aplicas a: registro, verificación de código, login, logout y recuperación de contraseña.

### 2.1 La anatomía de un bloque `@swagger`

Va como comentario de bloque justo encima de la ruta que describe:

```js
/**
 * @swagger
 * /ruta:
 *   metodo:
 *     tags: [Grupo]
 *     summary: Una línea que resume qué hace
 *     description: Más detalle si hace falta
 *     requestBody:              # solo si el endpoint recibe body (POST/PUT)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Qué pasó si salió bien
 *       400:
 *         description: Qué pasó si algo vino mal
 */
router.route("/ruta").metodo(controlador);
```

Todo va en YAML dentro del comentario `/** ... */`. La indentación importa (como en YAML normal).

### 2.2 Primero: crea los schemas reutilizables

Antes de documentar rutas, vamos a definir la "forma" del objeto `Customer`, para no repetir sus campos en cada endpoint. Crea la carpeta y el archivo:

`public/backend/src/docs/schemas.js`

```js
/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 660f1b2e8a1e4c001f8e4a10
 *         name:
 *           type: string
 *           example: Ana
 *         lastName:
 *           type: string
 *           example: Martínez
 *         email:
 *           type: string
 *           format: email
 *           example: ana@example.com
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         birthdate:
 *           type: string
 *           format: date
 *         isVerified:
 *           type: boolean
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Mensaje de error
 *     MessageResponse:
 *       type: object
 *       description: >
 *         Misma forma que ErrorResponse ({ message }), pero para respuestas
 *         de éxito (2xx) que solo confirman que algo pasó, sin devolver un
 *         recurso. Separado de ErrorResponse a propósito: aunque el JSON sea
 *         idéntico, en la doc no queremos que un 200 apunte a algo llamado
 *         "Error".
 *       properties:
 *         message:
 *           type: string
 *           example: Operación exitosa
 */
```

Este archivo no exporta nada ni tiene código ejecutable — es puro comentario. Su único trabajo es que `swagger-jsdoc` lo lea (por eso ya lo incluimos en el `apis` de `swagger.js` con `./src/docs/*.js`).

Fíjate que definimos `ErrorResponse` también: todos tus controladores devuelven errores como `{ message: "..." }`, así que este schema lo vamos a reutilizar en **todas** las respuestas de error de toda la API.

### 2.3 Documenta el registro

Mira tu archivo real `public/backend/src/routes/registerCustomer.js` — tiene dos rutas: `POST /` (registro) y `POST /verifyCodeEmail`. El router se monta en `app.js` como `/api/registerCustomers`, así que la ruta completa es `/api/registerCustomers`.

Edita `public/backend/src/routes/registerCustomer.js` así:

```js
import express from "express";
import registerCustomerController from "../controller/registerCustomersController.js";

const router = express.Router();

/**
 * @swagger
 * /registerCustomers:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Registra un cliente nuevo y envía un código de verificación por correo
 *     description: >
 *       No crea la cuenta todavía. Guarda los datos temporalmente en una cookie
 *       firmada (`verificationToken`, 15 min) y envía un código de 6 caracteres
 *       al correo. La cuenta se crea recién en /verifyCodeEmail.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Código enviado por correo
 *       400:
 *         description: El correo ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error al enviar el correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").post(registerCustomerController.register);

/**
 * @swagger
 * /registerCustomers/verifyCodeEmail:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Confirma el código y crea la cuenta del cliente
 *     description: Requiere la cookie `verificationToken` que se creó en el paso anterior.
 *     security:
 *       - verificationTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationCodeRequest]
 *             properties:
 *               verificationCodeRequest:
 *                 type: string
 *                 example: a1b2c3
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *       400:
 *         description: Código incorrecto o sesión expirada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/verifyCodeEmail").post(registerCustomerController.verifyCode);

export default router;
```

Nota el uso de `$ref: '#/components/schemas/ErrorResponse'` — así reutilizamos el schema que definiste en el paso anterior en vez de repetir `{ message: string }` a mano cada vez.

### 2.4 Documenta login, verify y logout

Edita `public/backend/src/routes/loginCustomer.js` así (mantén el `import` de `verifyToken` que ya tiene el archivo):

```js
import express from "express";
import loginCustomerController from "../controller/loginCustomerController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

/**
 * @swagger
 * /loginCustomers:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Inicia sesión y setea la cookie de sesión del cliente
 *     description: >
 *       Si la contraseña falla 5 veces seguidas, bloquea la cuenta 15 minutos
 *       (campo `timeOut` del cliente). Si todo sale bien, setea la cookie
 *       httpOnly `authCookie` (JWT, válida 30 días) — no hace falta que el
 *       frontend haga nada más con la respuesta, el navegador la guarda solo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso (setea la cookie authCookie)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Contraseña incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Correo sin verificar, o cuenta bloqueada temporalmente (15 min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No existe una cuenta con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").post(loginCustomerController.login);

/**
 * @swagger
 * /loginCustomers/verify:
 *   get:
 *     tags: [Auth - Clientes]
 *     summary: Verifica la cookie de sesión y devuelve los datos del cliente autenticado
 *     description: Úsalo para saber si hay una sesión activa (por ejemplo, al recargar la página en el frontend).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: Payload decodificado del JWT
 *                   properties:
 *                     id:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       example: customer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: No hay cookie, o el token es inválido/expiró
 *       403:
 *         description: El token no es de un cliente (userType distinto de "customer")
 */
router.route("/verify").get(verifyToken, loginCustomerController.verify);

export default router;
```

Y `public/backend/src/routes/logout.js`:

```js
import express from "express";
import logoutController from "../controller/logoutController.js";

const router = express.Router();

/**
 * @swagger
 * /logout:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Cierra la sesión del cliente
 *     description: Limpia la cookie authCookie. No requiere body ni estar autenticado (limpiar una cookie que no existe no da error).
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada
 */
router.route("/").post(logoutController.logoutCustomer);

export default router;
```

Para marcar una ruta como protegida, agregas esta línea dentro del bloque, al mismo nivel que `tags` y `summary`:

```yaml
security:
  - cookieAuth: []
```

### 2.5 Documenta recuperación de contraseña

`public/backend/src/routes/recoveryPassword.js` se monta en `/api/recoveryPassword` y tiene 3 pasos, todos alrededor de una cookie temporal `recoveryCookie` (15 min, distinta de `authCookie`). Por eso agregamos un `securityScheme` propio, `recoveryCookieAuth` (arriba en el Módulo 1.2). Ojo con el detalle: **solo `verifyCode` y `newPassword` llevan `security`** — `requestCode` es quien *crea* la cookie, así que no puede exigirla como requisito de entrada.

Reemplaza el contenido completo del archivo por esto:

```js
import express from "express";
import recoveryPasswordController from "../controller/recoveryPasswordController.js";

const router = express.Router();

/**
 * @swagger
 * /recoveryPassword/requestCode:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Solicita un código de recuperación de contraseña por correo
 *     description: >
 *       Genera un código de 6 caracteres y lo guarda en una cookie httpOnly
 *       `recoveryCookie` (15 min), luego lo envía por correo. El siguiente
 *       paso (/verifyCode) necesita esa misma cookie, así que las tres
 *       llamadas de este flujo deben hacerse desde el mismo navegador/cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Código enviado, revisa tu correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: No existe una cuenta con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error al enviar el correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/requestCode").post(recoveryPasswordController.requestCode);

/**
 * @swagger
 * /recoveryPassword/verifyCode:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Verifica el código de recuperación
 *     description: >
 *       Requiere la cookie `recoveryCookie` creada en el paso anterior. Si el
 *       código es correcto, renueva esa misma cookie marcándola como
 *       `verified: true` (otros 15 min) — ese flag es lo que /newPassword
 *       revisa antes de dejar cambiar la contraseña.
 *     security:
 *       - recoveryCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codeRequest]
 *             properties:
 *               codeRequest:
 *                 type: string
 *                 example: a1b2c3
 *     responses:
 *       200:
 *         description: Código verificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Código incorrecto, o expiró (no hay cookie recoveryCookie)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/verifyCode").post(recoveryPasswordController.verifyCode);

/**
 * @swagger
 * /recoveryPassword/newPassword:
 *   post:
 *     tags: [Auth - Clientes]
 *     summary: Define la nueva contraseña tras verificar el código
 *     description: >
 *       Requiere que /verifyCode se haya llamado antes en la misma sesión de
 *       cookies (revisa el flag `verified` dentro de recoveryCookie). Al
 *       terminar, limpia recoveryCookie y resetea los intentos de login
 *       fallidos y el bloqueo temporal de la cuenta.
 *     security:
 *       - recoveryCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword, confirmNewPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: >
 *           Las contraseñas no coinciden, el código expiró (no hay
 *           recoveryCookie), o no se verificó el código antes (verified: false)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/newPassword").post(recoveryPasswordController.newPassword);

export default router;
```

### 2.6 Checkpoint ✅

Con el servidor corriendo, refresca `http://localhost:4001/api-docs`. Ahora deberías ver:

- Un grupo (tag) **Auth - Clientes** con 6 endpoints.
- Al hacer clic en cualquiera, ves el `summary`, el body esperado, y las respuestas documentadas.
- En "Schemas" (al final de la página) aparecen `Customer` y `ErrorResponse`.

Si no aparece nada nuevo: revisa que no haya un error de indentación YAML en el comentario (un espacio de más rompe todo el bloque, y `swagger-jsdoc` simplemente lo ignora sin avisar mucho). Compara indentación línea por línea con el ejemplo.

**Nota sobre "Try it out" con cookies:** Swagger UI puede probar estas rutas en vivo, pero como tu API usa cookies `httpOnly` entre dos orígenes (`localhost:4001` sirviendo la doc, cookie pensada para el front en `localhost:5173`), el botón "Try it out" del login sí funciona (mismo origen: 4001), y la cookie que setea queda guardada para las siguientes pruebas en la misma pestaña. Pruébalo: primero "Try it out" en login con un usuario real de tu base, y luego en `/loginCustomers/verify` — debería devolverte tu usuario sin que tengas que hacer nada más.

---

## Módulo 3 — Productos y Categorías

**Tiempo estimado: 35-40 min**

Estas rutas son de solo lectura en `public/backend` (crear/editar es trabajo del admin). Buen momento para aprender **parámetros de ruta** y a documentar objetos con relaciones (`populate`).

### 3.1 Agrega los schemas de Product y Category

En `public/backend/src/docs/schemas.js`, agrega (dentro del mismo bloque `components: schemas:`, como propiedades hermanas de `Customer`):

```yaml
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           example: iPhone
 *         description:
 *           type: string
 *         image:
 *           type: string
 *           format: uri
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           example: iPhone 15 Pro
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           example: 999.99
 *         originalPrice:
 *           type: number
 *         discount:
 *           type: number
 *         stock:
 *           type: integer
 *         category:
 *           type: object
 *           description: Poblado con populate("category", "name")
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         image:
 *           type: string
 *           format: uri
 *         condition:
 *           type: string
 *           enum: [Nuevo, Reacondicionado]
 *         storage:
 *           type: string
 *         ram:
 *           type: string
 *         color:
 *           type: string
 *         featured:
 *           type: boolean
 *         rating:
 *           type: number
 *           description: Promedio calculado a partir de las reseñas (no se guarda en BD)
 *           example: 4.5
 *         reviews:
 *           type: integer
 *           description: Cantidad de reseñas (calculado, no se guarda en BD)
```

Fíjate que documentamos `rating` y `reviews` como parte del `Product` aunque **no existen en el modelo de Mongoose** (`models/products.js`) — los agrega `agregarValoraciones()` en el controlador antes de responder. Esto es importante: **documentas lo que la API realmente devuelve, no lo que dice el schema de la base de datos.** Por eso dejamos una nota en `description` aclarando que es calculado.

### 3.2 Documenta las rutas de productos

Edita `public/backend/src/routes/products.js` (se monta en `/api/products`):

```js
import express from "express";
import productsController from "../controller/productsController.js";

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Catálogo]
 *     summary: Lista todos los productos del catálogo, con su valoración promedio
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").get(productsController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Catálogo]
 *     summary: Obtiene un producto por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de Mongo del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/:id").get(productsController.getProductById);

export default router;
```

Este es tu primer `parameters` — así se documenta cualquier valor que vaya en la URL (`:id`, `:productId`, etc.). Siempre lleva `in: path`, `name` igual al de la ruta de Express, y `required: true`.

### 3.3 Ahora tú: categorías

Con el mismo patrón, documenta `public/backend/src/routes/categories.js` (`/api/categories` y `/api/categories/{id}`), tag `Catálogo`, usando `$ref: '#/components/schemas/Category'`. Es prácticamente igual al de productos, cambiando el schema.

### 3.4 Checkpoint ✅

Refresca `/api-docs`: deberías ver el grupo **Catálogo** con 4 endpoints, y si expandes `Product` en Schemas al final, ves todos los campos incluyendo `rating` y `reviews` con su descripción de "calculado".

Prueba "Try it out" en `GET /products` — como esta ruta es pública (sin `security`), debería responder sin necesidad de login.

---

## Módulo 4 — Pedidos, Reseñas, Perfil y Wompi

**Tiempo estimado: 45-50 min**

Esta es la parte más densa: rutas protegidas, arrays anidados, y una integración externa (Wompi).

### 4.1 Schema de Order

Agrega a `schemas.js`:

```yaml
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: integer
 *         subtotal:
 *           type: number
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         customerName:
 *           type: string
 *         customerEmail:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         subtotal:
 *           type: number
 *         shipping:
 *           type: number
 *           description: 15 (fijo) o 0 si el subtotal es >= 500
 *         tax:
 *           type: number
 *           description: 13% del subtotal (IVA)
 *         total:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pendiente, procesando, enviado, entregado, cancelado]
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         payment:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *               enum: [wompi, contraentrega]
 *             transactionId:
 *               type: string
 *             status:
 *               type: string
 *             cardLast4:
 *               type: string
```

Nota cómo documentamos `shipping` y `tax` con su regla de negocio real (leída de `calcularPedido()` en `ordersController.js`) en la `description` — eso es oro para quien lea la doc y no quiera ir a leer el controlador.

### 4.2 Documenta orders

Edita `public/backend/src/routes/orders.js` (se monta en `/api/orders`, **todo requiere `security: [{ cookieAuth: [] }]`**):

```js
import express from "express";
import ordersController from "../controller/ordersController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Pedidos]
 *     summary: Crea un pedido a partir del carrito, calcula totales y descuenta stock
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products, address, phone]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               payment:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [wompi, contraentrega]
 *                   transactionId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Carrito vacío, faltan datos de envío, stock insuficiente, o producto ya no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado
 */
router.route("/").post(verifyToken, ordersController.createOrder);

/**
 * @swagger
 * /orders/mis-pedidos:
 *   get:
 *     tags: [Pedidos]
 *     summary: Lista los pedidos del cliente autenticado, del más reciente al más antiguo
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.route("/mis-pedidos").get(verifyToken, ordersController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Obtiene el detalle de un pedido propio
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       403:
 *         description: El pedido no pertenece a este cliente
 *       404:
 *         description: Pedido no encontrado
 */
router.route("/:id").get(verifyToken, ordersController.getMyOrderById);

export default router;
```

### 4.3 Ahora tú: reseñas y perfil

Con lo aprendido, documenta:

**`public/backend/src/routes/reviews.js`** (monta en `/api/reviews`), tag `Reseñas`. Agrega un schema `Review` (`productId`, `customerId`, `customerName`, `rating` 1-5, `comment` máx 500 caracteres) al `schemas.js`. Rutas:
- `GET /reviews/producto/{productId}` — pública, sin `security`.
- `GET /reviews/puedo-resenar/{productId}` — protegida. Responde `{ comprado, puedeReseñar, miReview }`.
- `POST /reviews` — protegida. Body `{ productId, rating, comment }`. `403` si no compró el producto, `400` si ya dejó reseña o rating fuera de rango.
- `PUT /reviews/{id}` y `DELETE /reviews/{id}` — protegidas, `403` si la reseña no es del cliente autenticado.

**`public/backend/src/routes/profile.js`** (monta en `/api/profile`), tag `Perfil`, **todas protegidas**:
- `GET /profile` — devuelve `Customer` (sin password).
- `PUT /profile` — body `{ name, lastName, phone, address, birthdate }`.
- `PUT /profile/password` — body `{ currentPassword, newPassword }`, `401` si la actual no coincide, `400` si la nueva tiene menos de 6 caracteres.

### 4.4 Wompi: cómo documentar una integración externa

`public/backend/src/routes/wompi.js` (`/api/wompi`) es distinto: son 4 endpoints que básicamente reenvían datos a la API real de Wompi (`id.wompi.sv`, `api.wompi.sv`). Aquí no vale la pena describir cada campo a fondo porque no son tuyos — documenta el **propósito** de cada uno y deja claro que son un proxy:

```js
/**
 * @swagger
 * /wompi/token:
 *   post:
 *     tags: [Pagos - Wompi]
 *     summary: Obtiene un access token OAuth de Wompi (paso previo para tokenizar tarjeta)
 *     description: Actúa como proxy hacia id.wompi.sv usando las credenciales del backend. No requiere body.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token de Wompi obtenido
 *       500:
 *         description: Wompi rechazó la solicitud o hubo un error de red
 */
```

Replica ese patrón (mismo nivel de detalle) para `/wompi/tokenizar`, `/wompi/paymentTest` y `/wompi/payment3DS`, ajustando el `summary` según el controlador (`wompiController.js`): tokenizar recibe datos de tarjeta, paymentTest hace un cobro sin 3DS, payment3DS hace un cobro con verificación 3DS.

### 4.5 Checkpoint ✅

Ya deberías tener en `/api-docs` los grupos: **Auth - Clientes, Catálogo, Pedidos, Reseñas, Perfil, Pagos - Wompi**. Cuenta los endpoints: deberían ser 6 + 4 + 3 + 5 + 3 + 4 = 25 endpoints documentados en `public/backend`.

**☕ Este es un buen punto para una pausa — llevas la mitad del curso (~1h45min-2h) y termina el backend más grande.**

---

## Módulo 5 — Backend privado / admin (puerto 4000)

**Tiempo estimado: 45-55 min**

Ahora repites el patrón completo, pero más rápido porque ya sabes la mecánica. La diferencia principal: rutas con `multipart/form-data` (subida de imágenes) y un esquema de seguridad distinto (`adminAuthCookie`).

### 5.1 Setup (igual que el Módulo 1, en el otro backend)

```bash
cd private/backend
npm install swagger-jsdoc swagger-ui-express
```

Crea `private/backend/src/swagger.js`:

```js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Applefly API — Admin",
      version: "1.0.0",
      description:
        "API del panel administrativo: gestión de productos, categorías, empleados, clientes y pedidos.",
    },
    servers: [
      { url: "http://localhost:4000/api", description: "Desarrollo local" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "adminAuthCookie",
          description:
            "Cookie que se setea al hacer login en /loginAdmin. JWT con { id, userType: 'admin', name, email, role }.",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
```

Y en `private/backend/app.js`, igual que antes:

```js
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./src/swagger.js";
// ...
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Checkpoint rápido:** `npm run dev` y revisa `http://localhost:4000/api-docs` — misma pantalla vacía que la primera vez.

### 5.2 Schemas: Employee y reutilizar lo que ya conoces

Crea `private/backend/src/docs/schemas.js`. `Customer`, `Product`, `Category` y `Order` los vuelves a escribir aquí (son un backend distinto con su propio `swagger.js`, así que no comparten `apis` — cada backend tiene su propio documento OpenAPI independiente). Puedes copiar los que ya escribiste en `public/backend/src/docs/schemas.js` y ajustar donde haga falta. Ojo con dos diferencias reales del modelo en este backend:

- `Product` aquí **no** tiene `rating`/`reviews` calculados (ese cálculo solo existe en `public/backend`).
- `Order` aquí **no** tiene el campo `payment` (ese modelo no lo define en `private/backend/src/models/orders.js` — es una inconsistencia entre los dos backends que vale la pena que notes: el admin no puede ver el método de pago del pedido).

Agrega también:

```yaml
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 *         salary:
 *           type: number
 *         DUI:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin, empleado]
```

### 5.3 loginAdmin

`private/backend/src/routes/loginAdmin.js`, monta en `/api/loginAdmin`, tag `Auth - Admin`:

- `POST /loginAdmin` — body `{ email, password }`. `200` con `{ message, user: {id, name, email, role} }` (setea `adminAuthCookie`, válida 8h). `401` contraseña incorrecta, `404` empleado no encontrado.
- `GET /loginAdmin/verify` — `security: [{ cookieAuth: [] }]`.

Y `private/backend/src/routes/logout.js` — ojo que aquí la ruta real es `POST /api/logout/admin` (revisa el archivo: `router.post("/admin", ...)`), tag `Auth - Admin`.

### 5.4 Empleados — y algo que vale la pena que documentes con precisión

Antes de escribir la doc de `private/backend/src/routes/employees.js`, mira el archivo con cuidado:

```js
router.route("/")
  .get(verifyAdmin, employeesController.getEmployees)
  .post(employeesController.insertEmployee);   // 👈 sin verifyAdmin
```

**`POST /employees` no tiene el middleware `verifyAdmin`.** Cualquiera que sepa la URL puede crear un empleado nuevo sin haber iniciado sesión — a diferencia de `PUT` y `DELETE`, que sí están protegidos. Esto probablemente sea un descuido y no una decisión intencional (piensa en el endpoint de registro del panel admin: normalmente uno esperaría que crear empleados fuera una acción solo de admin).

Tu trabajo como quien documenta la API **no es arreglarlo**, es **describir la realidad tal cual es** — para eso sirve la doc, para que alguien la lea y detecte justamente este tipo de cosas. Documéntalo así:

```js
/**
 * @swagger
 * /employees:
 *   post:
 *     tags: [Empleados]
 *     summary: Registra un nuevo empleado
 *     description: >
 *       ⚠️ A diferencia de los demás endpoints de este grupo, esta ruta NO
 *       pasa por el middleware verifyAdmin — se puede llamar sin sesión
 *       iniciada. Documentado así porque refleja el comportamiento actual
 *       del código; revisar si es intencional.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               salary:
 *                 type: number
 *               DUI:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [admin, empleado]
 *     responses:
 *       201:
 *         description: Empleado registrado
 *       400:
 *         description: El correo ya está registrado
 */
router.route("/").post(employeesController.insertEmployee);
```

Ahora tú, con `security: [{ cookieAuth: [] }]` porque sí pasan por `verifyAdmin`:
- `GET /employees` — lista (sin password).
- `PUT /employees/{id}` — body igual al de creación pero todo opcional, más `password` opcional (solo se actualiza si viene no-vacío).
- `DELETE /employees/{id}`.

### 5.5 Clientes (solo lectura desde el admin)

`private/backend/src/routes/customers.js`, tag `Clientes`, **todo protegido**:
- `GET /customers/count` → `{ count: number }`.
- `GET /customers` → lista de `Customer`.
- `GET /customers/{id}`.
- `DELETE /customers/{id}`.

### 5.6 Productos y Categorías con subida de imagen — `multipart/form-data`

Esta es la parte nueva de verdad. Mira `private/backend/src/routes/products.js`:

```js
router.route("/")
  .get(productsController.getProducts)                                          // público
  .post(verifyAdmin, upload.single("image"), productsController.insertProduct); // protegido + imagen
```

`upload.single("image")` es Multer + Cloudinary: espera un formulario `multipart/form-data` con un campo de archivo llamado `image`. En OpenAPI, un body con archivos se documenta con `content: multipart/form-data` y las propiedades de tipo archivo usan `type: string, format: binary`:

```js
/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Productos - Admin]
 *     summary: Crea un producto nuevo (con imagen)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               originalPrice:
 *                 type: number
 *               discount:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *                 description: ObjectId de la categoría
 *               condition:
 *                 type: string
 *                 enum: [Nuevo, Reacondicionado]
 *               storage:
 *                 type: string
 *               ram:
 *                 type: string
 *               color:
 *                 type: string
 *               featured:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 */
router.route("/").post(verifyAdmin, upload.single("image"), productsController.insertProduct);
```

Fíjate: en Swagger UI, cuando pruebes este endpoint con "Try it out", el formulario te va a mostrar un selector de archivo real para el campo `image` — así de literal es `format: binary`.

Ahora completa tú, con el mismo patrón:
- `GET /products` (público), `GET /products/{id}` (público), `GET /products/count` → `{ count }` (público — revisa la ruta, no lleva `verifyAdmin`).
- `PUT /products/{id}` — mismo body que el POST, `multipart/form-data`, protegido.
- `DELETE /products/{id}` — protegido.

Y replica exactamente esa misma estructura para `private/backend/src/routes/categories.js` (schema `Category`, campos `name`, `description`, `image`), incluyendo que `GET` es público y `POST/PUT/DELETE` son protegidos con subida de imagen en POST/PUT.

### 5.7 Pedidos desde el admin

`private/backend/src/routes/orders.js`, tag `Pedidos - Admin`, todo protegido:
- `GET /orders/count` → `{ count }`.
- `GET /orders` → lista completa (todos los clientes, no solo uno).
- `GET /orders/{id}`.
- `PUT /orders/{id}` — body `{ status }` (enum de `Order`). Este es el único que cambia el estado del pedido.
- `DELETE /orders/{id}`.

### 5.8 Checkpoint ✅

`http://localhost:4000/api-docs` debería mostrar: **Auth - Admin, Empleados, Clientes, Productos - Admin, Categorías - Admin, Pedidos - Admin**. En los endpoints de creación/edición de productos y categorías, el botón "Try it out" debe mostrarte un input de tipo archivo — pruébalo con una imagen real para confirmar que la doc coincide con el comportamiento real.

---

## Módulo 6 — Pulir y cerrar

**Tiempo estimado: 20-25 min**

### 6.1 Exporta el spec en crudo (útil para Postman)

`swagger-ui-express` no expone el JSON por sí solo — agrégalo tú mismo. En ambos `app.js`, junto a la línea de `/api-docs`:

```js
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
```

Con eso, en Postman puedes hacer "Import" → pegar `http://localhost:4001/api-docs.json` (o 4000) y te genera toda la colección de requests automáticamente.

### 6.2 Revisión de calidad — pásale esta checklist a cada backend

- [ ] Todo endpoint que use `verifyToken`/`verifyAdmin` tiene `security: [{ cookieAuth: [] }]`.
- [ ] `security` no es solo para `verifyToken`/`verifyAdmin`: cualquier endpoint que dependa de otra cookie/credencial leída a mano en el controlador (como `verificationToken` o `recoveryCookie`) también lleva su propio `security`, con su propio `securityScheme` — nunca reutilices `cookieAuth` para una credencial que no es la sesión de cliente/admin.
- [ ] Todo endpoint sin ese middleware **no** tiene `security` (así se ve claro en la UI cuál es pública y cuál no — Swagger UI dibuja un candado en las protegidas).
- [ ] Cada `requestBody` marca `required` solo los campos que el controlador realmente exige (revisa los `if (!campo)` de cada controlador).
- [ ] Los códigos de estado documentados (`404`, `400`, `401`, `403`, `500`...) coinciden con los que ves en el controlador — no inventes ni te falte ninguno relevante.
- [ ] Reusaste `$ref` en vez de copiar/pegar el mismo objeto en 5 endpoints distintos.
- [ ] Todo `500` cuyo controlador devuelva `{ message: "..." }` en el `catch` usa `$ref: ErrorResponse` igual que los 400/403/404 — no hay razón para tratarlo distinto. Excepción real: los 500 de `/wompi/*`, que reenvían el body crudo de Wompi (`{ error: "..." }`, otra forma) y por eso no deben referenciar `ErrorResponse`.
- [ ] Ningún `2xx` referencia `ErrorResponse`, aunque la forma `{ message }` coincida — para eso existe `MessageResponse`. Úsalo en cualquier `200`/`201` que solo confirme una acción sin devolver un recurso completo (logout, verifyCodeEmail, eliminar una reseña/categoría/producto, etc.).
- [ ] Los `tags` agrupan de forma consistente (mismo nombre exacto en todas las rutas de un mismo grupo — un typo crea un grupo nuevo por accidente).

### 6.3 Qué sigue (fuera del alcance de hoy, para cuando quieras profundizar)

- `oneOf` / `anyOf` para respuestas que pueden tener más de una forma.
- Versionar la API (`/api/v1/...`) y reflejarlo en `servers`.
- Mover `swaggerOptions` a variables de entorno (que la URL del `server` cambie entre dev/producción).
- Congelar el contrato exportando `api-docs.json` a un archivo y comparándolo en CI para detectar cambios sin querer ("contract testing").

---

## Anexo — Referencia rápida de todos los endpoints

### `public/backend` (puerto 4001, prefijo `/api`)

| Método | Ruta | Protegida | Tag sugerido |
|---|---|---|---|
| POST | /registerCustomers | No | Auth - Clientes |
| POST | /registerCustomers/verifyCodeEmail | No | Auth - Clientes |
| POST | /loginCustomers | No | Auth - Clientes |
| GET | /loginCustomers/verify | Sí | Auth - Clientes |
| POST | /logout | No | Auth - Clientes |
| POST | /recoveryPassword/requestCode | No | Auth - Clientes |
| POST | /recoveryPassword/verifyCode | No | Auth - Clientes |
| POST | /recoveryPassword/newPassword | No | Auth - Clientes |
| GET | /products | No | Catálogo |
| GET | /products/:id | No | Catálogo |
| GET | /categories | No | Catálogo |
| GET | /categories/:id | No | Catálogo |
| POST | /orders | Sí | Pedidos |
| GET | /orders/mis-pedidos | Sí | Pedidos |
| GET | /orders/:id | Sí | Pedidos |
| GET | /reviews/producto/:productId | No | Reseñas |
| GET | /reviews/puedo-resenar/:productId | Sí | Reseñas |
| POST | /reviews | Sí | Reseñas |
| PUT | /reviews/:id | Sí | Reseñas |
| DELETE | /reviews/:id | Sí | Reseñas |
| GET | /profile | Sí | Perfil |
| PUT | /profile | Sí | Perfil |
| PUT | /profile/password | Sí | Perfil |
| POST | /wompi/token | Sí | Pagos - Wompi |
| POST | /wompi/tokenizar | Sí | Pagos - Wompi |
| POST | /wompi/paymentTest | Sí | Pagos - Wompi |
| POST | /wompi/payment3DS | Sí | Pagos - Wompi |

### `private/backend` (puerto 4000, prefijo `/api`)

| Método | Ruta | Protegida | Tag sugerido |
|---|---|---|---|
| POST | /loginAdmin | No | Auth - Admin |
| GET | /loginAdmin/verify | Sí | Auth - Admin |
| POST | /logout/admin | No | Auth - Admin |
| GET | /employees | Sí | Empleados |
| POST | /employees | **No (revisar)** | Empleados |
| PUT | /employees/:id | Sí | Empleados |
| DELETE | /employees/:id | Sí | Empleados |
| GET | /customers/count | Sí | Clientes |
| GET | /customers | Sí | Clientes |
| GET | /customers/:id | Sí | Clientes |
| DELETE | /customers/:id | Sí | Clientes |
| GET | /products/count | No | Productos - Admin |
| GET | /products | No | Productos - Admin |
| GET | /products/:id | No | Productos - Admin |
| POST | /products | Sí | Productos - Admin |
| PUT | /products/:id | Sí | Productos - Admin |
| DELETE | /products/:id | Sí | Productos - Admin |
| GET | /categories | No | Categorías - Admin |
| GET | /categories/:id | No | Categorías - Admin |
| POST | /categories | Sí | Categorías - Admin |
| PUT | /categories/:id | Sí | Categorías - Admin |
| DELETE | /categories/:id | Sí | Categorías - Admin |
| GET | /orders/count | Sí | Pedidos - Admin |
| GET | /orders | Sí | Pedidos - Admin |
| GET | /orders/:id | Sí | Pedidos - Admin |
| PUT | /orders/:id | Sí | Pedidos - Admin |
| DELETE | /orders/:id | Sí | Pedidos - Admin |

**Total: 27 + 27 = 54 endpoints documentados al terminar el curso.**
