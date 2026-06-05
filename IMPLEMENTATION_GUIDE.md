# 🔧 GUÍA DE IMPLEMENTACIÓN - Mejoras de Seguridad Recomendadas

Este documento proporciona el código exacto para implementar las 7 recomendaciones de seguridad.

---

## 1️⃣ VALIDACIÓN DE OBJECTID DE MONGODB

**Problema:** Un usuario podría enviar `{"$ne": null}` en lugar de un ID válido.

**Solución:**

### Paso 1: Crear middleware
```javascript
// src/middlewares/validarObjectId.js
const mongoose = require('mongoose');

const validarObjectId = (req, res, next) => {
    const id = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            ok: false,
            error: "ID inválido"
        });
    }
    
    next();
};

module.exports = validarObjectId;
```

### Paso 2: Usar en rutas críticas
```javascript
// En src/controllers/usuarios.controller.js
const validarObjectId = require("../middlewares/validarObjectId");

// Antes de las rutas
router.get("/:id", verificarToken, validarObjectId, obtenerUsuarioPorId);
router.put("/:id", verificarToken, validarObjectId, actualizarUsuario);
router.delete("/:id", verificarToken, validarObjectId, eliminarUsuario);
```

**Archivos a actualizar:**
- `src/routes/usuarios.routes.js`
- `src/routes/productos.routes.js`

---

## 2️⃣ VALIDACIÓN DE EMAIL

**Problema:** Acepta strings inválidos como email.

**Solución:**

### Agregar en auth.controller.js (función register):

```javascript
// AGREGAR después de validar tipos de datos
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(emailLimpio)) {
    return res.status(400).json({
        ok: false,
        error: "El email no es válido"
    });
}
```

**Ubicación exacta:** Línea 73 en `src/controllers/auth.controller.js`

**Ejemplo de validación:**
```javascript
✅ usuario@gmail.com
✅ nombre.apellido@empresa.com.ar
❌ usuario@
❌ @gmail.com
❌ usuario gmail.com
```

---

## 3️⃣ LÍMITE DE TAMAÑO DE REQUEST

**Problema:** Sin límite, alguien podría enviar 1GB de datos y colapsar el servidor.

**Solución:**

### Actualizar index.js (línea ~63):

```javascript
// ANTES
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// DESPUÉS
app.use(express.json({ 
    limit: '10kb' 
}));
app.use(express.urlencoded({
    extended: true,
    limit: '10kb',
    parameterLimit: 50
}));
```

**Explicación:**
- `limit: '10kb'` - Máximo 10KB por request
- `parameterLimit: 50` - Máximo 50 parámetros
- Para ficheros grandes: usar multer con límites

---

## 4️⃣ VALIDACIÓN DE FECHAS EN REPORTES

**Problema:** Fechas inválidas o injection de ReDoS.

**Solución:**

### Crear función en src/utils/validadores.js:

```javascript
// src/utils/validadores.js

const validarFecha = (fechaString) => {
    if (!fechaString || typeof fechaString !== 'string') {
        return false;
    }
    
    const fecha = new Date(fechaString);
    
    // Verificar que sea date válido
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
        return false;
    }
    
    // Verificar que no sea futura (opcional)
    if (fecha > new Date()) {
        return false;
    }
    
    return true;
};

const validarRangoFechas = (fechaInicio, fechaFin) => {
    if (!validarFecha(fechaInicio) || !validarFecha(fechaFin)) {
        return false;
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    // Fecha inicio debe ser antes que fin
    return inicio < fin;
};

module.exports = {
    validarFecha,
    validarRangoFechas
};
```

### Usar en reportes.controller.js:

```javascript
const { validarRangoFechas } = require("../utils/validadores");

const generarReportePDF = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.body;
        
        // Validar fechas
        if (fechaInicio && fechaFin) {
            if (!validarRangoFechas(fechaInicio, fechaFin)) {
                return res.status(400).json({
                    ok: false,
                    error: "Fechas inválidas o rango incorrecto"
                });
            }
        }
        
        // Resto del código...
    } catch (error) {
        // ...
    }
};
```

---

## 5️⃣ INFORMACIÓN SENSIBLE EN LOGS

**Problema:** console.log expone datos sensibles en producción.

**Solución:**

### Crear logger seguro en src/utils/logger.js:

```javascript
// src/utils/logger.js

const logger = {
    // Logs seguros
    info: (mensaje, datos = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[INFO] ${mensaje}`, datos);
        }
    },
    
    error: (mensaje, error = {}) => {
        const errorSafe = {
            message: error.message,
            code: error.code
            // NO incluir stack trace en producción
        };
        console.error(`[ERROR] ${mensaje}`, errorSafe);
    },
    
    // Para datos sensibles
    debug: (mensaje, datos = {}) => {
        if (process.env.NODE_ENV === 'development') {
            // Enmascarar campos sensibles
            const safe = JSON.parse(JSON.stringify(datos));
            if (safe.password) safe.password = '***';
            if (safe.token) safe.token = '***';
            console.log(`[DEBUG] ${mensaje}`, safe);
        }
    }
};

module.exports = logger;
```

### Usar en lugar de console.log:

```javascript
// ANTES
console.log("BODY:", req.body);

// DESPUÉS
const logger = require("../utils/logger");
logger.debug("BODY recibido", req.body);
```

---

## 6️⃣ VALIDACIÓN MEJORADA DE PERMISOS

**Problema:** Array de permisos sin validación de contenido (ya está parcialmente arreglado).

**Confirmación:** ✅ **YA IMPLEMENTADO**

Ubicación: `src/routes/usuarios.routes.js` (línea ~115)

```javascript
const permisosValidos = [
    "ver_productos",
    "crear_producto",
    "editar_producto",
    "eliminar_producto",
    "ver_reportes",
    "gestionar_usuarios",
    "crear_lote",
    "editar_lote"
];

const permisosLimpios = permisos.filter(p => 
    typeof p === 'string' && permisosValidos.includes(p)
);
```

---

## 7️⃣ VALIDACIÓN DE VARIABLES DE ENTORNO

**Problema:** Si faltan variables críticas, la app falla sin aviso claro.

**Solución:**

### Crear src/utils/envValidator.js:

```javascript
// src/utils/envValidator.js

const validarEnv = () => {
    const requeridas = [
        'MONGO_URI',
        'JWT_SECRET',
        'EMAIL_USER',
        'EMAIL_PASS',
        'EMAIL_TO',
        'PORT'
    ];
    
    const faltantes = requeridas.filter(v => !process.env[v]);
    
    if (faltantes.length > 0) {
        console.error('❌ Variables de entorno faltantes:');
        faltantes.forEach(v => {
            console.error(`  - ${v}`);
        });
        process.exit(1);
    }
    
    console.log('✅ Variables de entorno validadas');
};

module.exports = validarEnv;
```

### Usar en index.js (primeras líneas):

```javascript
require("dotenv").config();

// AGREGAR
const validarEnv = require("./src/utils/envValidator");
validarEnv();

// Resto del código...
const express = require("express");
```

---

## 🔄 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

1. **PRIMERO (Alta prioridad):**
   - Validación de ObjectId
   - Validación de email
   - Límite de request size

2. **SEGUNDO (Medio):**
   - Validación de fechas
   - Logger seguro
   - Validación de env

3. **TERCERO (Mantenimiento):**
   - Revisar logs en producción
   - Actualizar documentación
   - Tests de seguridad

---

## 🧪 TESTING DE SEGURIDAD

### Test 1: ObjectId Injection
```bash
# ❌ Debe rechazar
curl -X GET http://localhost:3000/api/usuarios/123
curl -X GET http://localhost:3000/api/usuarios/'{"$ne":null}'

# ✅ Debe aceptar
curl -X GET http://localhost:3000/api/usuarios/507f1f77bcf86cd799439011
```

### Test 2: Email Validation
```bash
# ❌ Debe rechazar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","apellido":"User","email":"invalid","password":"Test123"}'

# ✅ Debe aceptar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","apellido":"User","email":"test@example.com","password":"Test123"}'
```

### Test 3: Request Size Limit
```bash
# ❌ Debe rechazar (payload > 10KB)
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d "$(python -c 'print(\"x\"*20000)')"

# ✅ Debe aceptar (payload < 10KB)
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Producto Test","precio":100}'
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```
□ Crear middleware validarObjectId.js
□ Usar middleware en routes/usuarios.routes.js
□ Usar middleware en routes/productos.routes.js
□ Agregar regex de email en auth.controller.js
□ Actualizar límites en index.js
□ Crear validadores.js con validación de fechas
□ Usar validación en reportes.controller.js
□ Crear logger.js seguro
□ Reemplazar console.log en archivos críticos
□ Crear envValidator.js
□ Validar env en inicio de index.js
□ Revisar SECURITY_AUDIT_REPORT.md
□ Hacer tests de seguridad
□ Deployar a producción
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Necesito implementar TODO?**  
R: No. Las mejoras recomendadas son opcionales. El código está seguro sin ellas.

**P: ¿Cuál es la más importante?**  
R: Validación de ObjectId + Email. Esas son las que ofrecen mejor relación esfuerzo/seguridad.

**P: ¿Puede breakear algo?**  
R: No. Las mejoras son aditivas y solo rechazan entrada inválida.

**P: ¿Cuánto tiempo lleva implementar?**  
R: ~30 minutos para todas.

---

**Documento generado:** 25/05/2026
