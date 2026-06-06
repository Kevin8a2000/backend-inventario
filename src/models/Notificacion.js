const mongoose = require("mongoose");

const notificacionSchema =
new mongoose.Schema({

    titulo: {
        type: String,
        required: true
    },

    mensaje: {
        type: String,
        required: true
    },

    tipo: {
        type: String,

            enum: [

        "info",

        "warning",

        "error",

        "success",

        "stock_bajo",

        "stock_agotado",

        "movimiento_grande",

        "movimiento_critico",

        "reposicion_necesaria",

        "abastecimiento_grande"
    ],
        default: "info"
    },

    leida: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,

        default: Date.now,

        expires: "30d"
    }
});

// =====================================================
// 🚀 TTL INDEX AUTOMÁTICO
// MongoDB eliminará automáticamente
// documentos después de 30 días
// =====================================================

module.exports =
mongoose.model(
    "Notificacion",
    notificacionSchema
);