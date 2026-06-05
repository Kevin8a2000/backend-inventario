// =====================================================
// 🔔 CONFIGURACIÓN DE NOTIFICACIONES
// Umbrales realistas para empresa
// =====================================================

const notificacionesConfig = {
    
    // =====================================================
    // 📦 STOCK
    // =====================================================
    stock: {
        // Stock crítico: 0 unidades - SONAR
        critico: 0,
        
        // Stock muy bajo: <= 20 unidades - SONAR
        muy_bajo: 20,
        
        // Stock bajo: < 50 unidades - AVISO
        bajo: 50,
        
        // Stock mínimo para reposición: < 50 - AVISO
        reposicion_minima: 50
    },

    // =====================================================
    // 🔄 MOVIMIENTOS
    // =====================================================
    movimientos: {
        // Movimiento normal: < 50 unidades
        normal: 50,
        
        // Movimiento grande: 50-100 unidades - AVISO (sin sonido)
        grande: 50,
        grande_max: 100,
        
        // Movimiento crítico: >= 100 unidades - SONAR
        critico: 100,
        
        // Abastecimiento en lotes: >= 200 unidades - SONAR FUERTE
        lote_grande: 200
    },

    // =====================================================
    // 📅 VENCIMIENTOS
    // =====================================================
    vencimientos: {
        // 30+ días: Informativo (sin sonido)
        informativo: 30,
        
        // 15-29 días: Aviso normal (sin sonido)
        aviso: 15,
        
        // 7-14 días: CRÍTICO - SONAR
        critico: 7,
        
        // 3-6 días: MUY CRÍTICO - SONAR FUERTE
        muy_critico: 3,
        
        // <= 0 días: VENCIDO - SONAR CRÍTICO
        vencido: 0
    },

    // =====================================================
    // 🔊 SONIDOS
    // =====================================================
    sonidos: {
        // Sonido de alerta normal (bajo)
        normal: {
            archivo: "alert-normal.mp3",
            volumen: 0.5,
            duracion: 2000
        },
        
        // Sonido de alerta crítica (medio)
        critico: {
            archivo: "alert-critical.mp3",
            volumen: 0.8,
            duracion: 3000
        },
        
        // Sonido de alerta máxima (alto + repetir)
        muy_critico: {
            archivo: "alert-critical-urgent.mp3",
            volumen: 1.0,
            duracion: 4000,
            repetir: true
        }
    },

    // =====================================================
    // 🎨 COLORES Y ESTILOS
    // =====================================================
    estilos: {
        // Notificación informativa
        informativo: {
            color: "blue",
            icono: "ℹ️",
            estilo: "info"
        },
        
        // Notificación de aviso
        aviso: {
            color: "yellow",
            icono: "⚠️",
            estilo: "warning"
        },
        
        // Notificación crítica
        critico: {
            color: "orange",
            icono: "🚨",
            estilo: "danger"
        },
        
        // Notificación muy crítica
        muy_critico: {
            color: "red",
            icono: "🚀",
            estilo: "critical"
        }
    }
};

module.exports = notificacionesConfig;
