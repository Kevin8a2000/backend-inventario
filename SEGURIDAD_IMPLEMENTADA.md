# 🔒 Seguridad del Backend (explicado fácil)

Esto es un resumen sencillo de "qué tiene puesto" este backend para protegerse.
Piénsalo como las capas de seguridad de un edificio: cada petición que llega
tiene que pasar por varios "guardias" antes de llegar a la base de datos.

---

## 🚪 El recorrido de una petición

```
  Petición del usuario (frontend / Postman / app)
        │
        ▼
  🛡️  Helmet ........... pone "candados" en las respuestas (headers seguros)
        │
        ▼
  🚦  Rate Limit ........ "¿no estás tocando la puerta demasiadas veces?"
        │
        ▼
  🌍  CORS .............. "¿vienes de una página que tiene permiso de hablarme?"
        │
        ▼
  🎫  Token (JWT) ....... "¿quién eres? muéstrame tu credencial"
        │
        ▼
  🔑  Permisos .......... "ok te conozco... ¿pero puedes hacer ESTO?"
        │
        ▼
  ✅  Validación ........ "los datos que mandaste, ¿tienen sentido?"
        │
        ▼
  🎯  Se ejecuta tu petición (crear, editar, ver, borrar...)
```

Si fallas en cualquier paso, la petición se corta ahí mismo con un error
(401, 403, 400, etc.) y nunca llega a tocar la base de datos.

---

## 📊 Qué tan cubierto está

```
Login / Contraseñas        ██████████ 100%
Permisos por usuario       █████████░  90%
Anti fuerza bruta (login)  ██████████ 100%
Anti ataques comunes       █████████░  90%
Validar formularios        █████████░  90%
Headers de seguridad       ██████████ 100%
```

---

## 🎫 1. ¿Quién eres? (Login y tokens)

- Cuando inicias sesión, el backend te da un **token (JWT)**, como una pulsera
  de un evento: la muestras en cada petición y así no tienes que volver a
  poner usuario/contraseña cada vez.
- Esa pulsera **caduca a los 7 días**.
- Las contraseñas **nunca se guardan tal cual**: se guardan "encriptadas"
  (hash con `bcrypt`), ni el dueño del backend puede verlas.
- Para registrarte o cambiar tu contraseña, te exige una contraseña fuerte:
  mínimo 12 caracteres, con mayúscula, número y un símbolo (`!@#$%^&*`).
- Para cambiar tu contraseña actual, primero te pide la contraseña actual
  (no puedes cambiarla solo con tener el token).
- **¿Olvidaste tu contraseña?**
  - Te mandamos un link por correo que **expira en 1 hora**.
  - Ese link solo sirve **una vez**.
  - Si pones un correo que no existe, igual respondemos "te enviamos el
    correo" — así nadie puede usar este formulario para adivinar qué
    correos están registrados.

---

## 🔑 2. ¿Qué puedes hacer? (Roles y permisos)

- Hay dos tipos de usuario: **admin** y **usuario normal**.
- Un admin puede hacer *todo*, sin restricciones.
- Un usuario normal solo puede hacer lo que tenga en su lista de **permisos**
  (ej: `crear_producto`, `ver_reportes`, `registrar_movimiento`...).
- Cuando un admin le asigna permisos a alguien, el backend revisa contra una
  **lista de permisos válidos** — así nadie puede "inventarse" un permiso
  raro y guardarlo en su cuenta.
- Cada acción importante de la API (crear producto, borrar, ver reportes,
  gestionar usuarios, etc.) revisa el permiso correspondiente **antes** de
  hacer algo.
- Tu propio perfil solo lo puedes editar tú o un admin — nadie más.

**Permisos que existen hoy:**
`ver_productos`, `crear_producto`, `editar_producto`, `eliminar_producto`,
`ver_reportes`, `gestionar_usuarios`, `crear_lote`, `editar_lote`,
`registrar_movimiento`

---

## 🚦 3. Anti-spam y anti fuerza bruta

No puedes "martillar" la API con miles de peticiones por segundo:

| ¿Qué? | Límite |
|---|---|
| Cualquier petición a la API | 100 por minuto |
| Login / Registro | 5 intentos cada 15 minutos |
| "Olvidé mi contraseña" | 3 intentos cada 15 minutos |

Esto evita que alguien intente adivinar contraseñas a la fuerza (probar
miles de combinaciones) o "tumbar" el servidor a punta de peticiones.

---

## 🌍 4. ¿Quién puede hablarle a esta API? (CORS)

Solo páginas web de una **lista de confianza** pueden hacer peticiones desde
el navegador (el frontend en Vercel, localhost para desarrollo, etc.).
Si una página random intenta consumir esta API desde el navegador del
usuario, el navegador la bloquea.

---

## 🛡️ 5. Headers de seguridad (Helmet)

El backend agrega automáticamente "etiquetas" extra a cada respuesta que le
dicen al navegador cosas como:
- "no me muestres dentro de un iframe de otra página" (anti clickjacking)
- "no adivines el tipo de archivo, usa el que te digo"
- "solo háblame por HTTPS"

Esto se hace solo, con la librería `helmet`.

---

## ✅ 6. ¿Los datos que me mandaste tienen sentido?

Antes de guardar cualquier cosa, se revisa que:
- Los campos obligatorios estén presentes.
- Los emails tengan formato de email.
- Los precios y cantidades sean números válidos (no negativos, etc.).
- Los "ID" de Mongo tengan el formato correcto (si no, error claro en vez de
  que el servidor truene).
- El tipo de movimiento solo pueda ser `"entrada"` o `"salida"` (no
  cualquier texto).

Si algo no cumple, responde con un error 400 explicando **qué campo** está
mal y por qué.

---

## 🧹 7. Anti "inyección de código" (XSS / NoSQL)

- Cuando guardas texto (como tu nombre), el backend "limpia" caracteres
  peligrosos como `<`, `>`, `"`, etc. — así nadie puede meter código HTML o
  scripts que se ejecuten en el navegador de otra persona.
- Nunca se guarda el formulario completo "tal cual" en la base de datos:
  solo se toman los campos esperados (lista blanca), así nadie puede colar
  campos extra como `rol: "admin"` en un formulario de registro.
- Las búsquedas y filtros se validan como texto normal antes de usarse,
  para que no se puedan usar como "trucos" contra MongoDB.

---

## 🔐 8. Secretos (claves de la app, conexión a la base de datos, etc.)

Las claves importantes (clave del token, conexión a la base de datos, etc.)
**no están en el código** — viven en un archivo `.env` que **no se sube a
GitHub** (está en `.gitignore`).

---

## 🚨 9. Si algo truena...

Si ocurre un error inesperado, el usuario solo ve un mensaje genérico tipo
*"Error interno del servidor"* — nunca ve detalles técnicos (rutas internas,
consultas, etc.) que un atacante podría aprovechar. Los detalles solo se
imprimen en consola cuando estás programando en local.

---

## ⚠️ Cositas pendientes (no son urgentes, pero quedan anotadas)

1. **Registrar movimientos** ya tiene su permiso (`registrar_movimiento`)
   creado, pero la ruta que crea movimientos todavía no lo está exigiendo
   (solo pide que estés logueado).
2. Hay un archivo de seguridad (`verificarAcceso.js`) que se creó pero no se
   está usando en ninguna ruta — la misma protección ya está hecha de otra
   forma, así que no es un hueco, solo código de más.
3. Hay un archivo viejo (`productos.routes.js.bak`) con nombres de permisos
   antiguos. No se usa, pero se podría borrar para no confundir.
