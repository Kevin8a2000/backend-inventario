## 🔔 NOTIFICACIONES EN TIEMPO REAL CON SONIDO

### 📋 Estado Actual

✅ **Backend configurado completamente:**
- Socket.IO integrado
- Notificaciones live emitidas automáticamente
- Umbrales realistas de empresa
- Sistema de prioridades con sonido

---

## 🚀 FLUJO COMPLETO

### 1️⃣ TIPO DE ALERTAS Y UMBRALES (EMPRESA REAL)

#### **📦 STOCK**
| Situación | Umbral | Acción | Sonido |
|-----------|--------|--------|--------|
| Stock agotado | 0 unidades | CRÍTICA | 🔊 Sí |
| Stock muy bajo | ≤ 20 unidades | REPOSICIÓN URGENTE | 🔊 Sí |
| Stock bajo | < 50 unidades | Reposición necesaria | ❌ No |

#### **🔄 MOVIMIENTOS**
| Tipo | Cantidad | Acción | Sonido |
|------|----------|--------|--------|
| Normal | < 50 unidades | Registro | ❌ No |
| Movimiento grande | 50-100 unidades | AVISO | ❌ No |
| Movimiento crítico | ≥ 100 unidades | ALERTA | 🔊 Sí |
| Abastecimiento lotes | ≥ 200 unidades | ALERTA FUERTE | 🔊🔊 Sí |

#### **📅 VENCIMIENTOS**
| Días restantes | Acción | Sonido |
|---|---|---|
| 30+ días | Informativo | ❌ No |
| 15-29 días | Aviso | ❌ No |
| 7-14 días | CRÍTICO | 🔊 Sí |
| 3-6 días | MUY CRÍTICO | 🔊🔊 Sí |
| ≤ 0 días | VENCIDO | 🔊🔊🔊 Sí |

---

## 🔧 CÓMO FUNCIONA

### Backend (Node.js)

```
1. Usuario registra movimiento
   ↓
2. Sistema valida cantidad contra umbrales
   ↓
3. Si cumple umbral → crearNotificacion(titulo, mensaje, tipo, producto, io, sonarAlarma)
   ↓
4. Notificación guardada en MongoDB
   ↓
5. Socket.IO emite: io.emit("nueva_notificacion", {..., sonarAlarma: true})
   ↓
6. Frontend recibe evento en tiempo real (sin refrescar)
   ↓
7. Si sonarAlarma = true → Reproduce sonido
   ↓
8. Actualiza campanita + contador + puntito rojo
```

### Frontend (Vite/React)

```javascript
// 1. Conectar Socket.IO
import io from "socket.io-client";
const socket = io("http://localhost:3000");

// 2. Escuchar evento
socket.on("nueva_notificacion", (notificacion) => {
    console.log("Nueva notificación:", notificacion);
    
    // 3. Reproducir sonido SI sonarAlarma = true
    if (notificacion.sonarAlarma) {
        reproducirSonidoCritico();
    }
    
    // 4. Actualizar UI
    actualizarCampanita(notificacion);
});
```

---

## 🎵 SISTEMA DE SONIDOS

### Archivos a descargar/crear:

**Frontend:** Necesitas 3 archivos de audio en `public/sonidos/`

```
public/
  └── sonidos/
      ├── alert-normal.mp3 (sonido bajo, 2s)
      ├── alert-critical.mp3 (sonido medio, 3s)
      └── alert-critical-urgent.mp3 (sonido alto, 4s - repetible)
```

### Uso:

```javascript
// Sonido normal (aviso)
const audioNormal = new Audio("/sonidos/alert-normal.mp3");
audioNormal.volume = 0.5;
audioNormal.play();

// Sonido crítico (alto)
const audioCritico = new Audio("/sonidos/alert-critical.mp3");
audioCritico.volume = 0.8;
audioCritico.play();

// Sonido crítico urgente (máximo + repetir)
const audioUrgente = new Audio("/sonidos/alert-critical-urgent.mp3");
audioUrgente.volume = 1.0;
audioUrgente.loop = true;
audioUrgente.play();
// Detener: audioUrgente.pause();
```

---

## 📊 EJEMPLOS DE NOTIFICACIONES

### ✅ REPOSICIÓN NECESARIA (Stock < 50)
```
Título: "⚠️ Reposición necesaria"
Mensaje: "Reposición: Arroz Blanco necesita abastecimiento (45 unidades)"
Sonido: ❌ No (a menos que sea < 20)
```

### 🚨 REPOSICIÓN URGENTE (Stock ≤ 20)
```
Título: "🚨 REPOSICIÓN URGENTE"
Mensaje: "⚠️ CRÍTICO: Arroz Blanco stock muy bajo (15 unidades)"
Sonido: 🔊 Sí
```

### ⚠️ MOVIMIENTO GRANDE (50-100 unidades)
```
Título: "⚠️ Movimiento grande"
Mensaje: "SALIDA de 75 unidades de Aceite de Oliva. Stock: 250"
Sonido: ❌ No
```

### 🚨 MOVIMIENTO CRÍTICO (≥ 100 unidades)
```
Título: "🚨 MOVIMIENTO CRÍTICO"
Mensaje: "ENTRADA importante de 120 unidades de Harina Premium. Stock: 380"
Sonido: 🔊 Sí
```

### 🚀 ABASTECIMIENTO GRANDE (≥ 200 unidades)
```
Título: "🚀 ABASTECIMIENTO GRANDE"
Mensaje: "Entrada de 250 unidades de Azúcar. Stock nuevo: 580 unidades"
Sonido: 🔊🔊 Sí (FUERTE)
```

### 🚨 VENCIMIENTO CRÍTICO (7 días)
```
Título: "🚨 ALERTA CRÍTICA DE VENCIMIENTO"
Mensaje: "⚠️ CRÍTICO: Leche de Cabra vence en 7 DÍAS. ACCIÓN INMEDIATA."
Sonido: 🔊 Sí
```

### 🚀 VENCIMIENTO INMINENTE (≤ 3 días)
```
Título: "🚀 VENCIMIENTO INMINENTE"
Mensaje: "⚠️⚠️ CRÍTICO: Yogur Griego vence en 2 DÍAS. LIQUIDACIÓN URGENTE."
Sonido: 🔊🔊 Sí (REPETIR)
```

### 🚨 PRODUCTO VENCIDO
```
Título: "🚨 PRODUCTO VENCIDO"
Mensaje: "⚠️⚠️ CRÍTICO: Queso Fresco YA HA VENCIDO. ELIMINAR DEL INVENTARIO INMEDIATAMENTE."
Sonido: 🔊🔊🔊 Sí (CRÍTICO)
```

---

## 🎯 PRÓXIMOS PASOS (FRONTEND)

### PASO 1: Instalar Socket.IO Client
```bash
npm install socket.io-client
```

### PASO 2: Crear servicio de Socket.IO
```javascript
// src/services/socketService.js
import io from "socket.io-client";

export const socket = io("http://localhost:3000");

export const conectarSocket = () => {
    socket.on("connect", () => {
        console.log("🟢 Conectado al servidor");
    });
};
```

### PASO 3: Escuchar notificaciones
```javascript
socket.on("nueva_notificacion", (notificacion) => {
    console.log("🔔 Nueva notificación:", notificacion);
    
    // Reproducir sonido si es prioritario
    if (notificacion.sonarAlarma) {
        reproducirAlarma(notificacion.prioridad);
    }
    
    // Actualizar campanita
    agregarNotificacion(notificacion);
});
```

### PASO 4: Actualizar UI (Campanita)
- Aumentar contador
- Mostrar puntito rojo
- Mostrar lista de notificaciones
- Reproducir sonido

---

## 🔐 NOTAS IMPORTANTES

1. **Sonido en navegador**: El navegador requiere interacción del usuario para reproducir sonido. La primera vez puede ser necesario hacer clic en la página.

2. **Volumen**: Revisar `notificaciones.config.js` para ajustar volúmenes según necesidad.

3. **Cancelar alarma**: Cuando el usuario vea la notificación, puede hacer clic para silenciar alarmas urgentes.

4. **Persistencia**: Las notificaciones se guardan en MongoDB. Frontend puede mostrar histórico.

5. **Múltiples clientes**: Socket.IO emite a TODOS los clientes conectados automáticamente.

---

## 📝 ESTADO ACTUAL

✅ Backend 100% listo
⏳ Frontend: A implementar

**Próximo paso**: Configurar Socket.IO en Frontend con notificaciones live y sonido.
