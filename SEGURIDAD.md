# SEGURIDAD — Backend Inventario

**Proyecto:** Backend Inventario (InvenStock)
**Stack:** Node.js + Express + MongoDB (Mongoose) + JWT
**Última revisión:** Junio 2026

---

## Resumen general

| Vulnerabilidad | Estado |
|---|---|
| Inyección NoSQL | Protegido |
| XSS (Cross-Site Scripting) | Protegido |
| CSRF (Cross-Site Request Forgery) | Protegido |
| Fuerza bruta / Brute Force | Protegido |
| Control de acceso deficiente | Protegido |
| Enumeración de usuarios | Protegido |
| Cabeceras HTTP inseguras | Protegido |
| CORS permisivo | Protegido |
| Fuga de errores en producción | Protegido |
| Mass Assignment | Protegido |

---

## 1. Inyección NoSQL

**Riesgo:** Un atacante podría enviar objetos como `{ "$gt": "" }` en lugar de strings para manipular consultas de MongoDB.

**Cómo está protegido:**

- En el login y registro se valida explícitamente el tipo antes de consultar:
  ```js
  if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: "Datos inválidos" });
  }
  ```
- `express-validator` valida formato en todos los endpoints (`.isEmail()`, `.isMongoId()`, `.isIn([...])`, etc.) antes de que el dato llegue a la BD.
- Los modelos de Mongoose castean los tipos definidos en el schema, rechazando valores inesperados.
- Las búsquedas de texto usan `sanitizarTexto()` que aplica `escaparHTML()` antes de usarlas en filtros.

**Archivos clave:**
- `src/middlewares/validarInputs.js`
- `src/middlewares/validarObjectId.js`
- `src/utils/sanitizar.js`

---

## 2. XSS — Cross-Site Scripting

**Riesgo:** Un atacante podría guardar `<script>alert(1)</script>` en un campo de texto y que se ejecute en el navegador de otro usuario.

**Cómo está protegido:**

- Función `escaparHTML()` escapa los caracteres peligrosos en todos los strings antes de guardarlos:
  ```js
  texto.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#x27;")
       .replace(/\//g, "&#x2F;");
  ```
- `limpiarScripts()` elimina tags `<script>`, `javascript:` y event handlers `on*=`.
- Se aplica en: nombre y apellido al registrar, campos de productos, búsquedas, lotes, movimientos, perfil de usuario.
- Helmet añade la cabecera `Content-Security-Policy` automáticamente.

**Archivos clave:**
- `src/utils/sanitizar.js`
- `src/controllers/auth.controller.js` (nombre, apellido)
- `src/routes/productos.routes.js` (todos los campos de texto)

---

## 3. CSRF — Cross-Site Request Forgery

**Riesgo:** Una página maliciosa podría hacer que el navegador de la víctima envíe peticiones a la API usando sus cookies de sesión.

**Cómo está protegido:**

- La API **no usa cookies** para autenticación. Usa JWT en el header `Authorization: Bearer <token>`.
- Un formulario malicioso en otro dominio no puede agregar ese header automáticamente.
- CORS restringe qué orígenes pueden hacer peticiones al servidor.

> No se necesita token CSRF porque el esquema JWT en headers ya lo previene por diseño.

---

## 4. Fuerza Bruta / Brute Force

**Riesgo:** Un atacante prueba miles de contraseñas contra el login hasta acertar.

**Cómo está protegido:**

`express-rate-limit` configurado en tres niveles:

| Endpoint | Límite | Ventana |
|---|---|---|
| Toda la API | 100 peticiones | 1 minuto |
| `/api/auth/login` | 5 intentos | 15 minutos |
| `/api/auth/register` | 5 intentos | 15 minutos |
| `/api/auth/recuperar-password` | 3 intentos | 15 minutos |

Además, las contraseñas se almacenan con `bcryptjs` (10 rondas de salt), lo que hace inviable un ataque offline incluso si se filtra la BD.

**Archivos clave:**
- `index.js` (limiter general)
- `src/routes/auth.routes.js` (limiters específicos)

---

## 5. Control de Acceso Deficiente

**Riesgo:** Un usuario autenticado accede a recursos que no le pertenecen o ejecuta acciones sin permiso.

**Cómo está protegido:**

**Capa 1 — Autenticación JWT:**
```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.usuario = decoded; // { id, rol, permisos }
```
Todas las rutas protegidas usan `verificarToken` antes de cualquier operación.

**Capa 2 — Sistema de permisos granular:**

Cada acción requiere un permiso específico verificado en `verificarPermiso(permiso)`:

| Permiso | Rutas que lo exigen |
|---|---|
| `ver_productos` | `GET /api/productos/:id` |
| `crear_producto` | `POST /api/productos` |
| `editar_producto` | `PUT /api/productos/:id` |
| `eliminar_producto` | `DELETE /api/productos/:id`, `DELETE /api/productos/lotes/:id` |
| `crear_lote` | `POST /api/productos/lotes`, `PUT /api/productos/lotes/:id`, `GET /api/productos/lotes` |
| `registrar_movimiento` | `POST /api/movimientos`, `GET /api/movimientos` |
| `ver_reportes` | `GET /api/reporte/*`, `GET /api/productos/stock-bajo`, etc. |
| `gestionar_usuarios` | `GET /api/usuarios`, `PUT /api/usuarios/:id/permisos`, `DELETE /api/usuarios/:id` |

**Capa 3 — Control de recurso propio:**

Un usuario normal solo puede ver/editar su propio perfil:
```js
if (req.usuario.rol === 'admin') return next();
if (req.usuario.id === req.params.id) return next();
return res.status(403).json({ error: 'No tienes permiso' });
```

**Capa 4 — Whitelist de permisos:**

Al asignar permisos, se filtra contra una lista fija para que nadie invente permisos inexistentes:
```js
const permisosValidos = [
    "ver_productos", "crear_producto", "editar_producto", "eliminar_producto",
    "ver_reportes", "gestionar_usuarios", "crear_lote", "editar_lote",
    "registrar_movimiento"
];
const permisosLimpios = permisos.filter(p => permisosValidos.includes(p));
```

**Archivos clave:**
- `src/middlewares/auth.js`
- `src/middlewares/verificarPermiso.js`
- `src/routes/usuarios.routes.js`

---

## 6. Enumeración de Usuarios

**Riesgo:** El login devuelve mensajes distintos para "usuario no existe" y "contraseña incorrecta", permitiendo confirmar qué emails están registrados.

**Cómo está protegido:**

Ambos casos devuelven exactamente el mismo mensaje y el mismo código HTTP:
```js
const ERROR_CREDENCIALES = "Email o contraseña incorrectos";

if (!usuario) return res.status(401).json({ error: ERROR_CREDENCIALES });
if (!valido)  return res.status(401).json({ error: ERROR_CREDENCIALES });
```

Lo mismo aplica a recuperación de contraseña — responde `"Email enviado"` independientemente de si el correo existe o no.

**Archivo clave:**
- `src/controllers/auth.controller.js`

---

## 7. Cabeceras HTTP Inseguras

**Riesgo:** Sin cabeceras de seguridad el navegador es vulnerable a clickjacking, MIME sniffing, etc.

**Cómo está protegido:**

`helmet` se aplica globalmente en `index.js`:
```js
app.use(helmet());
```

Cabeceras que activa automáticamente:

| Cabecera | Efecto |
|---|---|
| `X-Frame-Options: DENY` | Evita que la app se cargue en iframes (anti-clickjacking) |
| `X-Content-Type-Options: nosniff` | El navegador no adivina el tipo MIME |
| `Strict-Transport-Security` | Fuerza HTTPS en producción |
| `Content-Security-Policy` | Restringe qué recursos puede cargar la página |
| `X-DNS-Prefetch-Control: off` | Desactiva prefetch DNS |
| `Referrer-Policy` | Controla qué info envía el header Referer |

---

## 8. CORS Permisivo

**Riesgo:** Cualquier página web podría hacer peticiones a la API desde el navegador del usuario.

**Cómo está protegido:**

Lista blanca de orígenes permitidos:
```js
const origenesPermitidos = [
    "https://invenstock-la-costa.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
];
```

Peticiones sin origen (Postman, apps móviles, cURL) se permiten para desarrollo. Cualquier otro origen del navegador recibe error CORS.

**Archivo clave:**
- `index.js`

---

## 9. Fuga de Errores en Producción

**Riesgo:** El stack trace de un error puede revelar rutas internas, versiones de librerías o estructura de la BD.

**Cómo está protegido:**

El error handler global solo imprime el error completo en desarrollo:
```js
app.use((error, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error("ERROR GLOBAL:", error);
    }
    res.status(500).json({ error: "Error interno del servidor" });
});
```

El mismo patrón se aplica en cada controller:
```js
if (process.env.NODE_ENV === 'development') {
    console.error("Login Error:", error.message);
}
```

---

## 10. Mass Assignment

**Riesgo:** Un atacante envía campos extra en el body (ej: `rol: "admin"`) esperando que se guarden directamente.

**Cómo está protegido:**

- En registro, solo se toman los campos esperados explícitamente:
  ```js
  const { nombre, apellido, email, password, confirmPassword } = req.body;
  ```
  El campo `rol` no se toma del body — siempre se asigna `"usuario"` por código.
- En actualización de perfil, solo se actualizan campos específicos con lista blanca.
- Los permisos solo se pueden asignar a través de la ruta `PUT /:id/permisos` con permiso `gestionar_usuarios`.

---

## 11. Contraseñas Seguras

- Almacenadas con `bcryptjs` (10 rondas de salt). Nunca en texto plano.
- Política de contraseña fuerte en registro y cambio de contraseña:
  - Mínimo 12 caracteres
  - Al menos 1 mayúscula
  - Al menos 1 número
  - Al menos 1 carácter especial (`!@#$%^&*`)
- Recuperación de contraseña mediante token único generado con `crypto.randomBytes(20)`, válido por 1 hora y de un solo uso.

---

## 12. Validación de Entrada

`express-validator` en todos los endpoints de escritura:

| Campo | Validación |
|---|---|
| Email | `.isEmail().normalizeEmail()` |
| Password | `.isLength({ min: 8 })` + regex |
| Nombre / Apellido | `.matches(/^[a-záéíóúñA-Z\s]+$/)` solo letras |
| SKU | `.matches(/^[a-zA-Z0-9\-_]+$/)` |
| Precio | `.isFloat({ min: 0.01 })` |
| Stock | `.isInt({ min: 0 })` |
| Tipo movimiento | `.isIn(['entrada', 'salida'])` |
| IDs de MongoDB | `.isMongoId()` vía `validarObjectId` |

Si algún campo falla, se rechaza la petición con `400` antes de tocar la BD.

---

## 13. Payload Size Limit

Se limita el tamaño máximo del body para prevenir ataques de payload masivo:
```js
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb', parameterLimit: 50 }));
```

---

## 14. Secretos y Variables de Entorno

Ninguna credencial está hardcodeada en el código:

| Variable | Uso |
|---|---|
| `JWT_SECRET` | Firma y verificación de tokens |
| `MONGODB_URI` | Conexión a la base de datos |
| `EMAIL_USER / EMAIL_PASS` | Envío de correos |
| `FRONTEND_URL` | Origen permitido en CORS y links de recuperación |

El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

---

## Flujo de seguridad por petición

```
Petición entrante
      │
      ▼
  Helmet ──────────── Cabeceras de seguridad en la respuesta
      │
      ▼
  Rate Limit ─────── ¿Demasiadas peticiones desde esta IP?
      │
      ▼
  CORS ────────────── ¿El origen está en la lista blanca?
      │
      ▼
  express.json ────── ¿El body supera 200kb?
      │
      ▼
  verificarToken ──── ¿El JWT es válido y no expiró?
      │
      ▼
  verificarPermiso ── ¿El usuario tiene el permiso requerido?
      │
      ▼
  validarInputs ───── ¿Los datos tienen el formato correcto?
      │
      ▼
  sanitizar ──────── Escapar HTML antes de guardar
      │
      ▼
  Base de datos ───── Operación ejecutada
```

Si falla cualquier capa, la petición se rechaza con el código HTTP correspondiente (`400`, `401`, `403`, `429`) y nunca llega a la base de datos.
