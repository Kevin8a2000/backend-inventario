## 🎯 SISTEMA NOTIFICACIONES EN TIEMPO REAL + SONIDO

### ✅ IMPLEMENTADO EN BACKEND

---

## 📋 CAMBIOS REALIZADOS

### 1️⃣ **Instalación Socket.IO**
```bash
npm install socket.io
```

### 2️⃣ **index.js** - Configuración Socket.IO
✅ Importado `http` y `Server` de socket.io
✅ Creado servidor HTTP
✅ Configurado Socket.IO con CORS
✅ Pasado `io` a `revisarVencimientos()`
✅ Listeners de conexión/desconexión

**Código:**
```javascript
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);
revisarVencimientos(io);

io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado");
    socket.on("disconnect", () => console.log("🔴 Usuario desconectado"));
});

server.listen(PORT, ...);
```

---

### 3️⃣ **crearNotificacion.js** - Emisión Live + Sonido
✅ Agregado parámetro `sonarAlarma` (boolean)
✅ Emitido evento `nueva_notificacion` con:
  - ID, título, mensaje, tipo
  - Producto, fecha, leída
  - **sonarAlarma** (true/false)
  - **prioridad** (normal/alta)

**Código:**
```javascript
const crearNotificacion = async (
    titulo,
    mensaje,
    tipo = "info",
    producto = null,
    io = null,
    sonarAlarma = false
) => {
    const notificacion = await Notificacion.create({...});
    
    if (io) {
        io.emit("nueva_notificacion", {
            ...notificacion,
            sonarAlarma,
            prioridad: sonarAlarma ? "alta" : "normal"
        });
    }
};
```

---

### 4️⃣ **movimientos.controller.js** - Umbrales Realistas
✅ **Stock agotado (0)** → CRÍTICA + SONIDO
✅ **Reposición urgente (≤ 20)** → CRÍTICA + SONIDO
✅ **Reposición necesaria (< 50)** → AVISO (sin sonido)
✅ **Movimiento grande (50-100)** → AVISO (sin sonido)
✅ **Movimiento crítico (≥ 100)** → CRÍTICA + SONIDO
✅ **Abastecimiento lotes (≥ 200)** → CRÍTICA FUERTE + SONIDO

**Ejemplo:**
```javascript
if (tipo === "entrada" && cantidad >= 200) {
    // ABASTECIMIENTO GRANDE
    await crearNotificacion(
        "🚀 ABASTECIMIENTO GRANDE",
        `Entrada de ${cantidad} unidades...`,
        "abastecimiento_grande",
        producto,
        io,
        true  // ← SONAR
    );
}
```

---

### 5️⃣ **vencimientos.service.js** - Umbrales Inteligentes
✅ **30 días** → Informativo (sin sonido)
✅ **15 días** → Aviso (sin sonido)
✅ **7 días** → CRÍTICO + SONIDO
✅ **3 días** → MUY CRÍTICO + SONIDO FUERTE
✅ **0 días (vencido)** → CRÍTICO MÁXIMO + SONIDO

**Ejemplo:**
```javascript
if (diferenciaDias === 7) {
    await crearNotificacion(
        "🚨 ALERTA CRÍTICA DE VENCIMIENTO",
        `⚠️ CRÍTICO: ${producto.nombre} vence en 7 DÍAS...`,
        "vencimiento_critico",
        producto._id,
        io,
        true  // ← SONAR
    );
}
```

---

### 6️⃣ **notificaciones.config.js** - Configuración Centralizada
✅ Umbrales de stock
✅ Umbrales de movimientos
✅ Umbrales de vencimientos
✅ Configuración de sonidos
✅ Mapeo de colores y estilos

**Contenido:**
```javascript
{
    stock: { critico: 0, muy_bajo: 20, bajo: 50, reposicion_minima: 50 },
    movimientos: { normal: 50, grande: 50, critico: 100, lote_grande: 200 },
    vencimientos: { informativo: 30, aviso: 15, critico: 7, muy_critico: 3, vencido: 0 },
    sonidos: { normal: {...}, critico: {...}, muy_critico: {...} }
}
```

---

## 🔊 FLUJO COMPLETO

```
Usuario registra movimiento (ej: 150 unidades)
    ↓
Sistema valida: cantidad >= 100 (MOVIMIENTO CRÍTICO)
    ↓
Backend llama: crearNotificacion(..., io, true)
    ↓
MongoDB: Guarda notificación
    ↓
Socket.IO: io.emit("nueva_notificacion", {
    titulo: "🚨 MOVIMIENTO CRÍTICO",
    mensaje: "ENTRADA importante de 150 unidades...",
    sonarAlarma: true,
    prioridad: "alta"
})
    ↓
Frontend RECIBE evento (sin refrescar página)
    ↓
IF sonarAlarma = true:
    ↓ Reproducir sonido crítico
    ↓ Mostrar notificación urgente
    ↓
Actualizar campanita:
    ↓ +1 contador
    ↓ Mostrar puntito rojo
    ↓ Shake animation
```

---

## 🎵 ESTRUCTURA DE SONIDOS ESPERADA

```
Frontend/
├── public/
│   └── sonidos/
│       ├── alert-normal.mp3 (volumen: 0.5)
│       ├── alert-critical.mp3 (volumen: 0.8)
│       └── alert-critical-urgent.mp3 (volumen: 1.0)
```

---

## 📊 MATRIZ DE NOTIFICACIONES

| Evento | Cantidad/Días | Sonido | Prioridad | Acción |
|--------|---|---|---|---|
| Stock = 0 | 0 unidades | 🔊 | Alta | CRÍTICA |
| Stock muy bajo | ≤ 20 unidades | 🔊 | Alta | REPOSICIÓN URGENTE |
| Stock bajo | < 50 unidades | ❌ | Normal | REPOSICIÓN |
| Movimiento grande | 50-100 unidades | ❌ | Normal | AVISO |
| Movimiento crítico | ≥ 100 unidades | 🔊 | Alta | ALERTA |
| Abastecimiento lotes | ≥ 200 unidades | 🔊 | Alta | INFORMACIÓN |
| Vence 30 días | 30 días | ❌ | Normal | INFO |
| Vence 15 días | 15 días | ❌ | Normal | AVISO |
| Vence 7 días | 7 días | 🔊 | Alta | CRÍTICA |
| Vence 3 días | ≤ 3 días | 🔊 | Alta | CRÍTICA+ |
| Vencido | ≤ 0 días | 🔊 | Alta | CRÍTICA++ |

---

## 🚀 PRÓXIMO PASO: FRONTEND

### Archivos a crear en Frontend:

1. **src/services/socketService.js** (usar template proporcionado)
2. **Crear carpeta: public/sonidos/** con 3 archivos MP3
3. **Actualizar campanita** para:
   - Conectar Socket.IO
   - Escuchar "nueva_notificacion"
   - Reproducir sonido si `sonarAlarma = true`
   - Actualizar contador + puntito rojo

### Comando para instalar Socket.IO Client:
```bash
npm install socket.io-client
```

---

## ✅ ESTADO ACTUAL

- ✅ Backend 100% configurado
- ✅ Socket.IO integrado y funcionando
- ✅ Umbrales realistas definidos
- ✅ Sistema de prioridades implementado
- ✅ Notificaciones emitidas automáticamente
- ⏳ Frontend: Pendiente

---

## 📝 ARCHIVOS MODIFICADOS/CREADOS

**Backend:**
- ✅ `index.js` - Socket.IO configurado
- ✅ `src/utils/crearNotificacion.js` - Sonido agregado
- ✅ `src/controllers/movimientos.controller.js` - Umbrales reales
- ✅ `src/services/vencimientos.service.js` - Umbrales reales
- ✅ `src/config/notificaciones.config.js` - **NUEVO**
- ✅ `NOTIFICACIONES_LIVE_SONIDO.md` - **NUEVO**
- ✅ `FRONTEND_NOTIFICACIONES_TEMPLATE.js` - **NUEVO (guía)**

---

## 🎯 RESULTADO

### Backend envía:
```json
{
    "_id": "647f4e5c6b3a1d9e8f2c5b1a",
    "titulo": "🚀 ABASTECIMIENTO GRANDE",
    "mensaje": "Entrada de 250 unidades de Arroz. Stock nuevo: 580 unidades",
    "tipo": "abastecimiento_grande",
    "producto": "647e8c2d4f5a9b1c6e3d2a0f",
    "sonarAlarma": true,
    "prioridad": "alta",
    "leida": false,
    "createdAt": "2024-05-26T14:30:45.123Z"
}
```

### Frontend debe:
1. Recibir evento
2. Reproducir `alert-critical-urgent.mp3` (volumen 1.0)
3. Actualizar campanita
4. Mostrar notificación
5. Permitir silenciar alarma

---

## 🔐 IMPORTANTE

⚠️ **Los navegadores requieren interacción del usuario para reproducir sonido.**

Solución: 
- Primera vez que carga la página: clickear en la página
- O agregar botón "Permitir sonidos" que reproduzca sonido mudo

---

## 💡 NOTAS

- Socket.IO emite a **TODOS** los clientes conectados (no solo al que hizo la acción)
- Si hay 5 usuarios conectados, todos reciben la notificación simultáneamente
- Las notificaciones se guardan en MongoDB (histórico)
- Frontend puede cargar notificaciones antiguas con GET /api/notificaciones

---

**Backend = ✅ LISTO**  
**Frontend = ⏳ A tu cargo**

¿Necesitas ayuda implementando el Frontend? 🚀
