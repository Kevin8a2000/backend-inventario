## 🎯 GUÍA PASO A PASO - NOTIFICACIONES LIVE + SONIDO

---

## 📦 BACKEND - YA COMPLETADO ✅

El backend está 100% listo. Contiene:

✅ Socket.IO integrado
✅ Notificaciones en tiempo real
✅ Umbrales realistas de empresa
✅ Sistema de prioridades
✅ Parámetro `sonarAlarma` en eventos

---

## 🚀 FRONTEND - GUÍA RÁPIDA

### PASO 1: Instalar Socket.IO Client

```bash
cd tu-proyecto-frontend
npm install socket.io-client
```

---

### PASO 2: Crear archivo de servicio

**Archivo:** `src/services/socketService.js`

Copia el contenido de `FRONTEND_NOTIFICACIONES_TEMPLATE.js` del backend.

O crea manualmente:

```javascript
// src/services/socketService.js

import io from "socket.io-client";

const socket = io("http://localhost:3000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

socket.on("connect", () => {
    console.log("🟢 Conectado al servidor");
});

socket.on("disconnect", () => {
    console.log("🔴 Desconectado");
});

// Escuchar notificaciones
socket.on("nueva_notificacion", (notificacion) => {
    console.log("🔔 Nueva notificación:", notificacion);
    
    // Si es prioritaria, reproducir sonido
    if (notificacion.sonarAlarma) {
        reproducirSonido(notificacion.prioridad);
    }
});

function reproducirSonido(prioridad) {
    const archivo = prioridad === "alta" 
        ? "/sonidos/alert-critical.mp3"
        : "/sonidos/alert-normal.mp3";
    
    const audio = new Audio(archivo);
    audio.volume = prioridad === "alta" ? 0.8 : 0.5;
    audio.play();
}

export default socket;
```

---

### PASO 3: Descargar archivos de sonido

Necesitas 3 archivos MP3 en `public/sonidos/`:

**Opción A - Usar sonidos gratuitos:**
- [Freesound.org](https://freesound.org/) - Buscar "alert beep"
- [Zapsplat](https://www.zapsplat.com/) - Sonidos gratuitos
- [Pixabay](https://pixabay.com/es/sound-effects/) - Efectos de sonido

**Opción B - Crear carpeta y archivos:**

```
public/
  └── sonidos/
      ├── alert-normal.mp3 (2 segundos)
      ├── alert-critical.mp3 (3 segundos)
      └── alert-critical-urgent.mp3 (4 segundos)
```

**Especificaciones:**
- Formato: MP3
- alert-normal: Volumen bajo (0.5), duración 2-3s
- alert-critical: Volumen medio (0.8), duración 3-4s
- alert-critical-urgent: Volumen máximo (1.0), duración 4-5s, puede ser repetible

---

### PASO 4: Crear componente Campanita

**Archivo:** `src/components/Campanita.jsx`

```jsx
import { useEffect, useState } from "react";
import socket from "@/services/socketService";

export default function Campanita() {
    const [contador, setContador] = useState(0);
    const [notificaciones, setNotificaciones] = useState([]);

    useEffect(() => {
        // Escuchar notificaciones
        socket.on("nueva_notificacion", (notificacion) => {
            setContador(c => c + 1);
            setNotificaciones(n => [notificacion, ...n].slice(0, 10));

            // Reproducir sonido si es crítico
            if (notificacion.sonarAlarma) {
                reproducirSonido(notificacion.prioridad);
            }

            // Vibración en móvil (opcional)
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        });

        return () => socket.off("nueva_notificacion");
    }, []);

    const reproducirSonido = (prioridad) => {
        let archivo, volumen;
        
        if (prioridad === "alta") {
            archivo = "/sonidos/alert-critical.mp3";
            volumen = 0.8;
        } else {
            archivo = "/sonidos/alert-normal.mp3";
            volumen = 0.5;
        }

        const audio = new Audio(archivo);
        audio.volume = volumen;
        audio.play().catch(e => console.warn("No se pudo reproducir sonido:", e));
    };

    const limpiarNotificaciones = () => {
        setContador(0);
        setNotificaciones([]);
    };

    return (
        <div className="relative">
            {/* Campanita */}
            <button
                onClick={limpiarNotificaciones}
                className="relative p-2 text-2xl hover:bg-gray-100 rounded-full transition"
            >
                🔔
                
                {/* Contador */}
                {contador > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {contador > 99 ? "99+" : contador}
                    </span>
                )}
                
                {/* Puntito rojo */}
                {contador > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Lista de notificaciones (opcional) */}
            {notificaciones.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-50">
                    {notificaciones.map((n) => (
                        <div
                            key={n._id}
                            className={`p-3 mb-2 rounded border-l-4 ${
                                n.sonarAlarma 
                                    ? "bg-red-100 border-red-500"
                                    : "bg-blue-100 border-blue-500"
                            }`}
                        >
                            <div className="font-bold text-sm">{n.titulo}</div>
                            <div className="text-xs text-gray-700 mt-1">{n.mensaje}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

---

### PASO 5: Integrar en Layout

**Archivo:** `src/layouts/AdminLayout.jsx` (o donde esté tu header)

```jsx
import Campanita from "@/components/Campanita";

export default function AdminLayout({ children }) {
    return (
        <div className="flex">
            <header className="flex items-center justify-between p-4">
                <h1>Panel de Inventario</h1>
                
                {/* Agregar campanita aquí */}
                <Campanita />
            </header>
            
            <main>{children}</main>
        </div>
    );
}
```

---

### PASO 6: Probar

1. **Inicia el backend:**
   ```bash
   cd backend-inventario
   npm start
   ```

2. **Inicia el frontend:**
   ```bash
   cd tu-frontend
   npm run dev
   ```

3. **Abre 2 navegadores:**
   - Browser 1: http://localhost:5173 (panel admin)
   - Browser 2: http://localhost:3000/api/movimientos (o tu frontend)

4. **Prueba:**
   - Registra un movimiento de 250 unidades (entrada)
   - ¡Deberías oír la alarma automáticamente!
   - Ver la campanita cambiar

---

## 🧪 EJEMPLOS DE PRUEBA

### Prueba 1: Movimiento Crítico
```
Producto: Arroz Blanco
Tipo: ENTRADA
Cantidad: 150 unidades

Resultado esperado:
✅ Sonido CRÍTICO (alert-critical.mp3)
✅ Título: "🚨 MOVIMIENTO CRÍTICO"
✅ Campanita con contador +1
```

### Prueba 2: Abastecimiento en Lotes
```
Producto: Aceite de Oliva
Tipo: ENTRADA
Cantidad: 250 unidades

Resultado esperado:
✅ Sonido URGENTE (alert-critical-urgent.mp3)
✅ Título: "🚀 ABASTECIMIENTO GRANDE"
✅ Campanita actualizada
```

### Prueba 3: Stock Bajo
```
Producto: Harina
Stock actual: 45 unidades
Tipo: SALIDA
Cantidad: 10 unidades

Resultado esperado:
✅ Stock ahora: 35 unidades (< 50)
✅ Título: "⚠️ Reposición necesaria"
✅ Sin sonido (a menos que stock < 20)
```

---

## 🔊 GUÍA DE SONIDOS

### Cómo asignar sonidos correctamente:

```javascript
prioridad = "normal"
  └─ Sonido: alert-normal.mp3
  └─ Volumen: 0.5
  └─ Uso: Stock bajo, movimiento grande
  └─ Acción usuario: Leer notificación

prioridad = "alta"
  └─ Sonido: alert-critical.mp3
  └─ Volumen: 0.8
  └─ Uso: Movimiento crítico, vencimiento 7 días
  └─ Acción usuario: Acción rápida necesaria

prioridad = "crítica" (muy_critico)
  └─ Sonido: alert-critical-urgent.mp3
  └─ Volumen: 1.0
  └─ Loop: true (repetir)
  └─ Uso: Stock = 0, vencimiento ≤ 3 días
  └─ Acción usuario: ACCIÓN INMEDIATA
```

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Cambiar volumen:
```javascript
const audio = new Audio("/sonidos/alert-critical.mp3");
audio.volume = 0.3;  // 0.0 = mute, 1.0 = máximo
audio.play();
```

### Repetir sonido urgente:
```javascript
const audio = new Audio("/sonidos/alert-critical-urgent.mp3");
audio.loop = true;  // ← Repetir hasta que usuario lo pare
audio.play();

// Para cuando usuario silencia:
// audio.pause();
```

### Vibración en móvil:
```javascript
if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200]);  // Patrón de vibración
}
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "No oigo el sonido"

1. ✅ Verifica que los archivos MP3 existan en `public/sonidos/`
2. ✅ Abre la consola (F12) y busca errores
3. ✅ Haz click en la página (navegadores requieren interacción)
4. ✅ Verifica volumen del sistema operativo
5. ✅ Prueba manualmente: `new Audio("/sonidos/alert-critical.mp3").play()`

### "La notificación no llega"

1. ✅ Verifica que Socket.IO esté conectado: `socket.connected`
2. ✅ Backend debe estar corriendo: `npm start`
3. ✅ Verifica la consola del navegador
4. ✅ Revisa que el evento se emita en backend

### "¿Por qué no suena en la primera notificación?"

- Los navegadores requieren interacción del usuario para reproducir audio
- Solución: Crear un botón "Permitir notificaciones" que juegue sonido mute

---

## 📋 CHECKLIST FINAL

- [ ] Socket.IO instalado (`npm install socket.io-client`)
- [ ] `socketService.js` creado
- [ ] Carpeta `public/sonidos/` con 3 archivos MP3
- [ ] Componente `Campanita` creado
- [ ] Campanita integrada en layout
- [ ] Backend corriendo (`npm start`)
- [ ] Frontend corriendo (`npm run dev`)
- [ ] Notificación emitida → Sonido suena
- [ ] Campanita se actualiza
- [ ] Puntito rojo aparece

---

## ✅ PRÓXIMO PASO

Cuando el frontend esté listo y funcione:

1. **Publicar en producción**
2. **Monitorear audios críticos**
3. **Ajustar volúmenes según feedback**
4. **Agregar más tipos de notificaciones si es necesario**

---

**¿Preguntas? Revisa los archivos de referencia:**
- `NOTIFICACIONES_LIVE_SONIDO.md`
- `RESUMEN_IMPLEMENTACION.md`
- `FRONTEND_NOTIFICACIONES_TEMPLATE.js`

---

**Estado actual: Backend ✅ | Frontend ⏳**

¿Necesitas help? 🚀
