# 🎯 GUÍA PARA FRONTEND - NOTIFICACIONES EN TIEMPO REAL CON SONIDO

## 📋 ÍNDICE
1. [Requisitos](#requisitos)
2. [Paso a Paso](#paso-a-paso)
3. [Archivos a Crear](#archivos-a-crear)
4. [Instalación de Dependencias](#instalación-de-dependencias)
5. [Integración en Componentes](#integración-en-componentes)
6. [Testing](#testing)

---

## ✅ Requisitos

- Proyecto Vite/React funcionando
- Node.js con npm
- Backend ejecutándose en `http://localhost:3000`
- Carpeta `public/` en el proyecto

---

## 🚀 Paso a Paso

### **PASO 1: Instalar Socket.IO Cliente**

```bash
npm install socket.io-client
```

**Verificar en `package.json`:**
```json
"dependencies": {
  "socket.io-client": "^4.7.0"
}
```

---

### **PASO 2: Descargar/Crear Archivos de Sonido**

📁 **Estructura de carpetas:**
```
public/
  └── sonidos/
      ├── alert-normal.mp3
      ├── alert-critical.mp3
      └── alert-critical-urgent.mp3
```

**Opciones de audio:**
- ✅ **Descargar gratuito:** freesound.org, zapsplat.com
- ✅ **Generador online:** ttsmp3.com (text-to-speech con alertas)
- ✅ **Usar tones:** crear con Audacity (simple)

**Requerimientos mínimos:**
- `alert-normal.mp3` → 2-3 segundos, volumen bajo
- `alert-critical.mp3` → 3-4 segundos, volumen medio
- `alert-critical-urgent.mp3` → 4-5 segundos, volumen alto, puede repetirse

---

### **PASO 3: Crear Servicio de Notificaciones**

**Archivo:** `src/services/notificaciones.service.js`

```javascript
// =====================================================
// 🔊 SERVICIO DE NOTIFICACIONES CON SONIDO
// =====================================================

import io from "socket.io-client";

// Conexión Socket.IO
const socket = io("http://localhost:3000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// =====================================================
// MAPEO DE SONIDOS
// =====================================================

const SONIDOS = {
    normal: {
        archivo: "/sonidos/alert-normal.mp3",
        volumen: 0.5,
        repetir: false
    },
    critico: {
        archivo: "/sonidos/alert-critical.mp3",
        volumen: 0.8,
        repetir: false
    },
    muy_critico: {
        archivo: "/sonidos/alert-critical-urgent.mp3",
        volumen: 1.0,
        repetir: true
    }
};

// =====================================================
// FUNCIÓN: Reproducir Sonido
// =====================================================

export const reproducirSonido = (tipoSonido) => {
    try {
        const config = SONIDOS[tipoSonido];
        
        if (!config) {
            console.warn(`Tipo de sonido no encontrado: ${tipoSonido}`);
            return;
        }

        const audio = new Audio(config.archivo);
        audio.volume = config.volumen;
        
        if (config.repetir) {
            audio.loop = true;
        }
        
        audio.play().catch(err => {
            console.error("Error al reproducir sonido:", err);
        });
        
        return audio;
    } catch (error) {
        console.error("Error en reproducirSonido:", error);
    }
};

// =====================================================
// FUNCIÓN: Detener Sonido
// =====================================================

export const detenerSonido = (audioElement) => {
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }
};

// =====================================================
// EVENTOS DE SOCKET.IO
// =====================================================

// Conexión establecida
socket.on("connect", () => {
    console.log("🟢 Conectado a notificaciones en tiempo real");
});

socket.on("disconnect", () => {
    console.log("🔴 Desconectado de notificaciones");
});

// =====================================================
// EVENTO PRINCIPAL: Nueva Notificación
// =====================================================

export const escucharNotificaciones = (callback) => {
    socket.on("nueva_notificacion", (notificacion) => {
        console.log("📬 Nueva notificación:", notificacion);
        
        // Reproducir sonido si la notificación lo indica
        if (notificacion.sonarAlarma) {
            // Determinar tipo de sonido según severidad
            let tipoSonido = "normal";
            
            if (notificacion.tipo === "CRÍTICA" || notificacion.tipo === "MUY CRÍTICO") {
                tipoSonido = "muy_critico";
            } else if (notificacion.tipo === "REPOSICIÓN URGENTE" || notificacion.tipo === "ALERTA") {
                tipoSonido = "critico";
            }
            
            reproducirSonido(tipoSonido);
        }
        
        // Llamar callback para actualizar UI
        if (callback) {
            callback(notificacion);
        }
    });
};

// =====================================================
// EXPORTAR SOCKET PARA USAR EN OTROS SERVICIOS
// =====================================================

export default socket;
```

---

### **PASO 4: Crear Contexto/Estado Global (React)**

**Archivo:** `src/context/NotificacionesContext.jsx`

```javascript
// =====================================================
// 📌 CONTEXTO DE NOTIFICACIONES (GLOBAL)
// =====================================================

import React, { createContext, useState, useCallback, useEffect } from "react";
import { escucharNotificaciones, reproducirSonido } from "../services/notificaciones.service";

export const NotificacionesContext = createContext();

export const NotificacionesProvider = ({ children }) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [audioActual, setAudioActual] = useState(null);

    // Escuchar notificaciones en tiempo real
    useEffect(() => {
        escucharNotificaciones((nuevaNotificacion) => {
            // Agregar a lista
            setNotificaciones(prev => [nuevaNotificacion, ...prev]);
            
            // Incrementar contador de no leídas
            setNoLeidas(prev => prev + 1);
            
            // Guardar en localStorage (opcional)
            localStorage.setItem(
                "ultimaNotificacion",
                JSON.stringify(nuevaNotificacion)
            );
        });
    }, []);

    // Marcar notificación como leída
    const marcarComoLeida = useCallback((notificacionId) => {
        setNoLeidas(prev => Math.max(0, prev - 1));
    }, []);

    // Limpiar notificaciones
    const limpiarNotificaciones = useCallback(() => {
        setNotificaciones([]);
        setNoLeidas(0);
    }, []);

    return (
        <NotificacionesContext.Provider
            value={{
                notificaciones,
                noLeidas,
                marcarComoLeida,
                limpiarNotificaciones,
                audioActual,
                setAudioActual
            }}
        >
            {children}
        </NotificacionesContext.Provider>
    );
};

export const useNotificaciones = () => {
    const context = React.useContext(NotificacionesContext);
    if (!context) {
        throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
    }
    return context;
};
```

---

### **PASO 5: Componente de Campana/Icono**

**Archivo:** `src/components/NotificacionesCampana.jsx`

```javascript
// =====================================================
// 🔔 COMPONENTE CAMPANA CON CONTADOR
// =====================================================

import React from "react";
import { useNotificaciones } from "../context/NotificacionesContext";
import "./NotificacionesCampana.css";

const NotificacionesCampana = () => {
    const { noLeidas, notificaciones } = useNotificaciones();

    return (
        <div className="notificaciones-campana">
            {/* Icono campana */}
            <button className="campana-btn">
                🔔
                {noLeidas > 0 && (
                    <>
                        <span className="badge">{noLeidas}</span>
                        <span className="puntito-rojo"></span>
                    </>
                )}
            </button>

            {/* Dropdown de notificaciones */}
            <div className="notificaciones-dropdown">
                {notificaciones.length === 0 ? (
                    <div className="sin-notificaciones">
                        <p>No hay notificaciones</p>
                    </div>
                ) : (
                    <div className="notificaciones-list">
                        {notificaciones.slice(0, 5).map((notif, idx) => (
                            <div key={idx} className={`notificacion-item ${notif.tipo.toLowerCase()}`}>
                                <div className="notif-header">
                                    <strong>{notif.titulo}</strong>
                                    <span className="notif-tipo">{notif.tipo}</span>
                                </div>
                                <p className="notif-mensaje">{notif.mensaje}</p>
                                {notif.producto && (
                                    <small className="notif-producto">
                                        📦 {notif.producto}
                                    </small>
                                )}
                                <small className="notif-hora">
                                    {new Date(notif.fechaCreacion).toLocaleTimeString()}
                                </small>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificacionesCampana;
```

**Archivo:** `src/components/NotificacionesCampana.css`

```css
/* =====================================================
   🔔 ESTILOS CAMPANA NOTIFICACIONES
   ===================================================== */

.notificaciones-campana {
    position: relative;
}

.campana-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    position: relative;
    padding: 8px;
}

.campana-btn:hover {
    transform: scale(1.1);
}

/* Badge contador */
.badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}

/* Puntito rojo intermitente */
.puntito-rojo {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    background: #ff0000;
    border-radius: 50%;
    animation: parpadeo 1s infinite;
}

@keyframes parpadeo {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.3; }
}

/* Dropdown */
.notificaciones-dropdown {
    position: absolute;
    top: 40px;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    width: 350px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
}

.campana-btn:hover ~ .notificaciones-dropdown,
.notificaciones-dropdown:hover {
    display: block;
}

/* Items notificación */
.notificacion-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    border-left: 4px solid #007bff;
}

.notificacion-item.crítica {
    border-left-color: #ff0000;
    background-color: #fff5f5;
}

.notificacion-item.alerta {
    border-left-color: #ff9800;
    background-color: #fff8f0;
}

.notif-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.notif-tipo {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    background: #e0e0e0;
    font-weight: bold;
}

.notif-mensaje {
    margin: 6px 0;
    font-size: 13px;
    color: #555;
}

.notif-producto {
    display: block;
    color: #888;
    font-size: 12px;
    margin-top: 4px;
}

.notif-hora {
    display: block;
    color: #999;
    font-size: 11px;
    margin-top: 4px;
}

.sin-notificaciones {
    padding: 20px;
    text-align: center;
    color: #999;
}
```

---

### **PASO 6: Integrar en App Principal**

**Archivo:** `src/App.jsx`

```javascript
import { NotificacionesProvider } from "./context/NotificacionesContext";
import NotificacionesCampana from "./components/NotificacionesCampana";

function App() {
    return (
        <NotificacionesProvider>
            <div className="app">
                {/* Navbar */}
                <nav className="navbar">
                    <h1>Sistema de Inventario</h1>
                    <NotificacionesCampana />
                </nav>

                {/* Contenido principal */}
                <main>
                    {/* Tu contenido aquí */}
                </main>
            </div>
        </NotificacionesProvider>
    );
}

export default App;
```

---

## 📁 Archivos a Crear - RESUMEN

```
src/
  ├── services/
  │   └── notificaciones.service.js       ← CREAR
  ├── context/
  │   └── NotificacionesContext.jsx       ← CREAR
  ├── components/
  │   ├── NotificacionesCampana.jsx       ← CREAR
  │   └── NotificacionesCampana.css       ← CREAR
  └── App.jsx                              ← MODIFICAR

public/
  └── sonidos/
      ├── alert-normal.mp3                ← DESCARGAR
      ├── alert-critical.mp3              ← DESCARGAR
      └── alert-critical-urgent.mp3       ← DESCARGAR
```

---

## 🧪 Testing - Verificar que Todo Funciona

### **Test 1: Verificar conexión Socket.IO**

Abrir `DevTools` (F12) → Console:

```javascript
import socket from "./services/notificaciones.service.js";
console.log(socket.connected); // Debe ser true
```

### **Test 2: Reproducir sonido manual**

En la consola:

```javascript
import { reproducirSonido } from "./services/notificaciones.service.js";
reproducirSonido("critico"); // Debe sonar
```

### **Test 3: Generar notificación desde backend**

**Backend (terminal del servidor):**

```bash
# Usar Postman o Thunder Client
POST http://localhost:3000/api/movimientos
Authorization: Bearer <tu_token>

Body (JSON):
{
    "producto": "672a1f2a3b4c5d6e7f8g9h0i",
    "cantidad": 250,
    "tipo": "entrada"
}
```

**Frontend:** Deberías ver:
- ✅ Notificación en dropdown
- ✅ Sonido 🔊 si `sonarAlarma: true`
- ✅ Badge rojo con contador
- ✅ Puntito rojo parpadeante

---

## 🛠️ Solución de Problemas

### ❌ No escucho sonido

**Soluciones:**
1. Verificar que `public/sonidos/` tenga los 3 archivos `.mp3`
2. Abrir DevTools → Console → Ver si hay errores
3. Revisar volumen del navegador
4. Chequear políticas de autoplay del navegador

### ❌ No recibo notificaciones en tiempo real

**Soluciones:**
1. Backend debe estar corriendo en `http://localhost:3000`
2. Verificar que Socket.IO está iniciado en el backend
3. Ver que `new io()` en backend no tenga errores
4. Chequear que CORS está configurado correctamente

### ❌ Notificaciones llegan pero sin sonido

**Verificar:**
```javascript
// En el servicio, añadir log
console.log("Notificación recibida:", notificacion);
console.log("sonarAlarma:", notificacion.sonarAlarma);
```

---

## 📞 Checklist Final

- ✅ Socket.IO instalado (`npm install socket.io-client`)
- ✅ Archivos de sonido en `public/sonidos/`
- ✅ Servicio `notificaciones.service.js` creado
- ✅ Contexto `NotificacionesContext.jsx` creado
- ✅ Componente `NotificacionesCampana.jsx` creado
- ✅ Estilos CSS aplicados
- ✅ App.jsx modificado con Provider
- ✅ Backend ejecutándose en puerto 3000
- ✅ Probado conexión Socket.IO
- ✅ Probado reproducción de sonidos

---

## 🎓 Próximos Pasos (Opcional)

- [ ] Persistencia: Guardar notificaciones en localStorage
- [ ] Notificaciones del navegador: `Notification API`
- [ ] Historial: Modal con todas las notificaciones
- [ ] Filtros: Por tipo de alerta, por producto
- [ ] Sonidos personalizables: Opción en settings

---

**¿Dudas?** ¡Pregunta al AI de tu frontend con estos archivos!
