const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({

    // =====================================================
    // 👤 DATOS BÁSICOS
    // =====================================================

    nombre: {

        type: String,

        required: true,

        trim: true
    },

    apellido: {

        type: String,

        required: true,

        trim: true
    },

    email: {

        type: String,

        unique: true,

        required: true,

        lowercase: true,

        trim: true
    },

    cargo: {

        type: String,

        default: ""
    },

    ubicacion: {

        type: String,

        default: ""
    },

    fotoPerfil: {

        type: String,

        default: null
    },

    password: {

        type: String,

        required: true
    },

    // =====================================================
    // 🔐 ROL
    // =====================================================

    rol: {

        type: String,

        enum: ["admin", "usuario"],

        default: "usuario"
    },

    // =====================================================
    // 🔥 PERMISOS DINÁMICOS
    // =====================================================

    permisos: {

        type: [String],

        default: []
    },

    // =====================================================
    // 📊 CONFIGURACIÓN PERSONAL
    // =====================================================

    configuracion: {

        temaOscuro: {

            type: Boolean,

            default: true
        },

        idioma: {

            type: String,

            default: "es"
        }
    },

    // =====================================================
    // 🔔 NOTIFICACIONES
    // =====================================================

    notificaciones: {

        stockBajo: {

            type: Boolean,

            default: true
        },

        stockAgotado: {

            type: Boolean,

            default: true
        },

        movimientoGrande: {

            type: Boolean,

            default: true
        },

        reportesSemanales: {

            type: Boolean,

            default: true
        },

        escritorio: {

            type: Boolean,

            default: true
        }
    },

    // =====================================================
    // ⚙️ PREFERENCIAS DE NOTIFICACIÓN
    // =====================================================

    preferencias: {

        email: {
            type: Boolean,
            default: true
        },

        reportes: {
            type: Boolean,
            default: true
        }
    },

    // =====================================================
    // ✅ ESTADO DEL USUARIO
    // =====================================================

    activo: {

        type: Boolean,

        default: true
    },

    // =====================================================
    // 🕒 ÚLTIMO LOGIN
    // =====================================================

    ultimoLogin: {

        type: Date,

        default: null
    },

    resetPasswordToken: String,

    resetPasswordExpires: Date

}, {

    timestamps: true
});

// =====================================================
// 🔥 MÉTODO PARA VALIDAR PERMISOS
// =====================================================

usuarioSchema.methods.tienePermiso = function (permiso) {

    // 🔥 ADMIN TIENE TODO
    if (this.rol === "admin") {

        return true;
    }

    // 🔥 PERMISO GLOBAL
    if (this.permisos.includes("*")) {

        return true;
    }

    // 🔥 VALIDAR PERMISO
    return this.permisos.includes(permiso);
};

module.exports = mongoose.model(
    "Usuario",
    usuarioSchema
);