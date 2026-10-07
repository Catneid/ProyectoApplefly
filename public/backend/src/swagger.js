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
            {
                // Relativa: sirve tanto en local como en Render, usando el
                // mismo dominio desde el que se abrió /api-docs.
                url: "/api",
                description: "Este servidor"
            },
            {
                url: "http://localhost:4001/api",
                description: "Desarrollo local"
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "authCookie",
                    description:
                    "Cookie httpOnly que se setea al hacer login en /loginCustomers. Contiene un JWT con { id, userType: 'customer', name, email }. Las rutas de cliente (pedidos, reseñas, perfil) aceptan también un ID token de Firebase como Bearer (firebaseIdTokenAuth): el backend lo traduce al mismo cliente de Mongo.",
                },
                recoveryCookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "recoveryCookie",
                    description:
                    "Cookie temporal (15 min) del flujo de recuperación de contraseña. La crea POST /recoveryPassword/requestCode y la leen /verifyCode y /newPassword. No tiene relación con la sesión del cliente (authCookie) — es de un solo uso y expira sola.",
                },
                recoveryTokenAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "X-Recovery-Token",
                    description:
                    "El mismo token de recuperación de la cookie recoveryCookie, para la app mobile (en React Native las cookies no son confiables). Lo devuelven en el body ({ token }) POST /recoveryPassword/requestCode y /verifyCode, y la app lo manda de vuelta en este header a /verifyCode y /newPassword. Si llegan la cookie y el header, manda la cookie.",
                },
                verificationTokenAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "verificationToken",
                    description:
                    "Cookie temporal (15 min) del flujo de registro. La crea POST /registerCustomers y la lee /registerCustomers/verifyCodeEmail. Tampoco tiene relación con authCookie.",
                },
                firebaseIdTokenAuth: {
                    type: "http",
                    scheme: "bearer",
                    description:
                    "ID token de Firebase Auth (header Authorization: Bearer <token>) de la app mobile. Lo verifica firebase-admin: verifyToken lo traduce al cliente de Mongo (rutas de cliente) y verifyFirebaseToken lo usa en el alta y la vinculación de cuentas. Es la sesión de la app; la web usa authCookie.",
                },
            },
        },
    },

    // Dónde buscar los comentarios @swagger. Iremos agregando archivos
    // a esta lista a medida que documentemos cada grupo de rutas.

    apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);