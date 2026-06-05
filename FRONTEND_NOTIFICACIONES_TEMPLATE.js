// =====================================================
// 🔊 SERVICIO DE NOTIFICACIONES CON SONIDO
// Para frontend (Vite/React)
// =====================================================

import io from "socket.io-client";

// =====================================================
// 1️⃣ CONECTAR SOCKET.IO
// =====================================================

const socket = io("http://localhost:3000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// =====================================================
// 2️⃣ EVENTOS DE CONEXIÓN
// =====================================================

socket.on("connect", () => {
    console.log("🟢 Conectado al servidor de notificaciones");
});

socket.on("disconnect", () => {
    console.log("🔴 Desconectado del servidor");
});

// =====================================================
// 3️⃣ SONIDOS - MAPEO DE ARCHIVOS
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
// 4️⃣ FUNCIÓN PARA REPRODUCIR SONIDO
// =====================================================

let audioActual = null;

export const reproducirSonido = (prioridad = "normal") => {
    try {
        // Detener sonido anterior si está corriendo
        if (audioActual) {
            audioActual.pause();
            audioActual.currentTime = 0;
        }

        const configuracion = SONIDOS[prioridad] || SONIDOS.normal;
        
        audioActual = new Audio(configuracion.archivo);
        audioActual.volume = configuracion.volumen;
        audioActual.loop = configuracion.repetir;
        
        audioActual.play().catch(error => {
            console.warn("No se pudo reproducir sonido:", error);
            // Algunos navegadores requieren interacción del usuario
        });

        console.log(`🔊 Sonido reproducido: ${prioridad}`);
        
    } catch (error) {
        console.error("Error al reproducir sonido:", error);
    }
};

// =====================================================
// 5️⃣ FUNCIÓN PARA DETENER SONIDO URGENTE
// =====================================================

export const detenerSonidoUrgente = () => {
    if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
        audioActual = null;
        console.log("🔇 Sonido detenido");
    }
};

// =====================================================
// 6️⃣ ESCUCHAR NOTIFICACIONES
// =====================================================

let contadorNotificaciones = 0;
const notificacionesStore = [];

socket.on("nueva_notificacion", (notificacion) => {
    console.log("🔔 NUEVA NOTIFICACIÓN:", notificacion);

    // Incrementar contador
    contadorNotificaciones++;

    // Guardar en store (opcional)
    notificacionesStore.push({
        ...notificacion,
        timestamp: new Date()
    });

    // =====================================================
    // 🔊 REPRODUCIR SONIDO SI ES PRIORITARIO
    // =====================================================

    if (notificacion.sonarAlarma) {
        const prioridad = notificacion.prioridad || "normal";
        reproducirSonido(prioridad);

        // 📲 OPCIONAL: Notificación del navegador
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notificacion.titulo, {
                body: notificacion.mensaje,
                icon: "🔔",
                badge: "🔔",
                tag: notificacion.tipo
            });
        }
    }

    // =====================================================
    // 🎨 ACTUALIZAR UI
    // =====================================================

    actualizarCampanita(notificacion);
    actualizarListaNotificaciones(notificacion);
    mostrarToastNotificacion(notificacion);
});

// =====================================================
// 7️⃣ FUNCIONES AUXILIARES PARA UI
// =====================================================

export const actualizarCampanita = (notificacion) => {
    // Buscar elemento campanita
    const campanita = document.querySelector("[data-campanita]");
    if (campanita) {
        // Mostrar puntito rojo
        campanita.classList.add("tiene-notificaciones");
        
        // Mostrar contador
        const contador = campanita.querySelector("[data-contador]");
        if (contador) {
            contador.textContent = contadorNotificaciones;
        }

        // Animar campanita
        campanita.classList.add("animate-shake");
        setTimeout(() => campanita.classList.remove("animate-shake"), 500);
    }
};

export const actualizarListaNotificaciones = (notificacion) => {
    // Buscar contenedor de notificaciones
    const lista = document.querySelector("[data-lista-notificaciones]");
    if (lista) {
        const item = crearItemNotificacion(notificacion);
        lista.insertAdjacentHTML("afterbegin", item);
        
        // Limitar a últimas 10 notificaciones en UI
        const items = lista.querySelectorAll("[data-notificacion]");
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }
};

export const crearItemNotificacion = (notificacion) => {
    const prioridad = notificacion.prioridad || "normal";
    const colorMap = {
        normal: "bg-blue-100 border-blue-300",
        alta: "bg-red-100 border-red-300"
    };

    return `
        <div data-notificacion="${notificacion._id}" class="p-3 mb-2 border-l-4 rounded ${colorMap[prioridad]} cursor-pointer hover:shadow-md transition">
            <div class="font-bold text-sm">${notificacion.titulo}</div>
            <div class="text-xs text-gray-600 mt-1">${notificacion.mensaje}</div>
            <div class="text-xs text-gray-500 mt-1">${new Date(notificacion.createdAt).toLocaleTimeString()}</div>
            ${notificacion.sonarAlarma ? '<span class="text-xs bg-red-500 text-white px-2 py-1 rounded mt-1 inline-block">🔊 Alarma</span>' : ''}
        </div>
    `;
};

export const mostrarToastNotificacion = (notificacion) => {
    // Si tienes librería como react-toastify o similar
    // toast[notificacion.prioridad === "alta" ? "error" : "warning"](
    //     notificacion.titulo,
    //     { description: notificacion.mensaje }
    // );
    
    // O crear toast manual:
    const toast = document.createElement("div");
    toast.className = notificacion.prioridad === "alta" 
        ? "bg-red-500 text-white" 
        : "bg-yellow-500 text-white";
    toast.className += " fixed bottom-4 right-4 p-4 rounded shadow-lg z-50 max-w-sm";
    toast.innerHTML = `
        <div class="font-bold">${notificacion.titulo}</div>
        <div class="text-sm">${notificacion.mensaje}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => toast.remove(), 5000);
};

// =====================================================
// 8️⃣ OBTENER NOTIFICACIONES (STORE)
// =====================================================

export const obtenerNotificaciones = () => {
    return notificacionesStore;
};

export const obtenerContador = () => {
    return contadorNotificaciones;
};

export const resetearContador = () => {
    contadorNotificaciones = 0;
    const campanita = document.querySelector("[data-campanita]");
    if (campanita) {
        campanita.classList.remove("tiene-notificaciones");
        const contador = campanita.querySelector("[data-contador]");
        if (contador) contador.textContent = "0";
    }
};

// =====================================================
// 9️⃣ SOLICITAR PERMISOS DE NOTIFICACIÓN
// =====================================================

export const solicitarPermisosNotificacion = () => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
};

// =====================================================
// EXPORTAR SOCKET PARA USAR EN OTROS COMPONENTES
// =====================================================

export default socket;
export { socket };

// =====================================================
// 📋 EJEMPLO DE USO EN COMPONENTE REACT
// =====================================================

/*

import { useEffect, useState } from "react";
import { solicitarPermisosNotificacion, resetearContador } from "@/services/notificacionesService";

export default function CampannitaWidget() {
    const [contador, setContador] = useState(0);

    useEffect(() => {
        solicitarPermisosNotificacion();
        
        // Escuchar notificaciones desde el servicio
        // (el servicio ya maneja todo automáticamente)
        
    }, []);

    const manejarClick = () => {
        resetearContador();
        setContador(0);
        // Abrir modal de notificaciones
    };

    return (
        <button 
            data-campanita
            onClick={manejarClick}
            className="relative p-3 text-2xl hover:bg-gray-100 rounded-full transition"
        >
            🔔
            {contador > 0 && (
                <>
                    <span 
                        data-contador
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {contador}
                    </span>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </>
            )}
        </button>
    );
}

*/
