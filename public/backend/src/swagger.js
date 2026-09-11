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
                firebaseIdTokenAuth: {
                    type: "http",
                    scheme: "bearer",
                    description:
                    "ID token de Firebase Auth (header Authorization: Bearer <token>) de la app mobile. Lo verifica verifyFirebaseToken con firebase-admin. Nada que ver con authCookie: esta es la sesión de Firebase, no la de la web.",
                },
            },
        },
    },

    // Dónde buscar los comentarios @swagger. Iremos agregando archivos
    // a esta lista a medida que documentemos cada grupo de rutas.

    apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);