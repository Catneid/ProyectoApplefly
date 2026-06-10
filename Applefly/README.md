# Applefly — Tienda online de dispositivos Apple reacondicionados

Aplicación web desarrollada en **React JS + Vite** como proyecto formativo del módulo 3.8 — *Proyecto innovador de desarrollo de software*, Instituto Técnico Ricaldone, 3° año de Desarrollo de Software.

## Descripción del proyecto

Applefly es una tienda online **exclusivamente de dispositivos Apple reacondicionados** (iPhone, iPad, MacBook, Apple Watch y AirPods). La aplicación ofrece un catálogo completo con filtros por categoría y condición, búsqueda, ordenamiento, detalle de producto, carrito de compras y autenticación simulada. En esta primera fase los datos son de muestra ("quemados"); en una fase posterior se conectará a un backend.

## Tecnologías utilizadas

- **React 19** — librería para la interfaz de usuario.
- **Vite 7** — herramienta de construcción rápida.
- **React Router DOM 7** — navegación SPA entre pantallas.
- **CSS variables / CSS modules** — estilos personalizados y diseño responsive.
- **ESLint** — lint y convenciones de código.

## Estructura de carpetas

```
Applefly/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── public/
│   └── logo.svg
└── src/
    ├── main.jsx               # Punto de entrada (Router + Providers)
    ├── App.jsx                # Definición de rutas
    ├── App.css
    ├── index.css              # Variables CSS y reset global
    ├── assets/
    │   ├── logo.svg
    │   └── logo-wordmark.svg
    ├── components/            # Componentes reutilizables
    │   ├── Boton.jsx
    │   ├── FiltrosSidebar.jsx
    │   ├── Footer.jsx
    │   ├── FormInput.jsx
    │   ├── HeroBanner.jsx
    │   ├── Navbar.jsx
    │   ├── SeccionBeneficios.jsx
    │   ├── SeccionCategorias.jsx
    │   ├── SeccionDestacados.jsx
    │   ├── SeccionPromos.jsx
    │   ├── SeccionTestimonios.jsx
    │   └── TelefonoCard.jsx
    ├── context/               # Context API (Carrito + Auth simulada)
    │   ├── AuthContext.jsx
    │   └── CartContext.jsx
    ├── data/                  # Datos de muestra ("quemados")
    │   ├── phones.js          # Catálogo 100% Apple
    │   └── testimonials.js
    └── screens/               # Pantallas / páginas
        ├── Inicio.jsx
        ├── Catalogo.jsx
        ├── DetalleProducto.jsx
        ├── Carrito.jsx
        ├── Login.jsx
        ├── Registro.jsx
        ├── Nosotros.jsx
        ├── Contacto.jsx
        └── NoEncontrado.jsx
```

## Instalación y ejecución

**Requisitos:** Node.js 18+ y npm.

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Correr el linter
npm run lint
```

Una vez ejecutado `npm run dev`, la aplicación estará disponible en `http://localhost:5173`.

## Funcionalidades implementadas

- **Navegación SPA** con React Router.
- **Catálogo 100% Apple** con filtros por categoría (iPhone, iPad, MacBook, Apple Watch, AirPods) y condición.
- **Búsqueda** de productos por nombre, categoría o color.
- **Ordenamiento** por precio, nombre, rating o destacados.
- **Detalle del producto** con especificaciones técnicas y productos relacionados.
- **Carrito de compras** persistente en sesión (Context API), con cálculo de subtotal, IVA, envío y total.
- **Autenticación simulada** (login / registro) con validación básica.
- **Formulario de contacto** con validaciones.
- **Diseño completamente responsive** (móvil / tablet / escritorio).
- **Paleta clara** basada en el diseño Figma oficial de Applefly.

## Paleta de colores (desde Figma)

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Fondo principal |
| `--color-bg-alt` | `#F8FAFC` | Fondo alterno |
| `--color-surface` | `#FFFFFF` | Cards |
| `--color-surface-alt` | `#F5F7F8` | Superficies secundarias |
| `--color-border` | `#E2E8F0` | Bordes |
| `--color-primary` | `#067FF9` | Azul de marca |
| `--color-primary-hover` | `#0570DD` | Hover primario |
| `--color-text` | `#0F172A` | Texto principal |
| `--color-text-muted` | `#64748B` | Texto secundario |

## Rutas de la aplicación

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Inicio` | Hero, categorías Apple, destacados, banners promocionales, beneficios y testimonios |
| `/catalogo` | `Catalogo` | Listado con filtros por categoría, búsqueda y ordenamiento |
| `/catalogo?categoria=iPhone` | `Catalogo` | Catálogo filtrado por categoría |
| `/producto/:id` | `DetalleProducto` | Ficha detallada del producto |
| `/carrito` | `Carrito` | Carrito de compras y resumen de checkout |
| `/login` | `Login` | Inicio de sesión |
| `/registro` | `Registro` | Registro de usuario |
| `/nosotros` | `Nosotros` | Historia, misión, visión y equipo |
| `/contacto` | `Contacto` | Formulario de contacto |
| `*` | `NoEncontrado` | Página 404 |

## Equipo de desarrollo

**Instituto Técnico Ricaldone**
**Módulo 3.8:** Proyecto innovador de desarrollo de software
**Docente:** Ing. Wilfredo Granados
**Tercer año — Desarrollo de Software**

> Completar con los nombres y carnés de los miembros del equipo antes de la entrega.

- Estudiante 1 — Carné
- Estudiante 2 — Carné
- Estudiante 3 — Carné
- Estudiante 4 — Carné

## Notas

- Todos los productos son **dispositivos Apple reacondicionados**: iPhone, iPad, MacBook, Apple Watch y AirPods.
- Los datos mostrados son **datos de muestra** (quemados) y no provienen de una API real.
- La autenticación es simulada: cualquier email con una contraseña de al menos 6 caracteres será aceptada.
- Las imágenes de los productos se cargan desde Unsplash (servicio público de imágenes).
- El cálculo de envío aplica gratis si la compra supera los $500; de lo contrario cobra $15.
- El IVA aplicado es del 13% (El Salvador).
