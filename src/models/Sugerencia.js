const mongoose = require("mongoose");

const sugerenciaSchema = new mongoose.Schema({

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    tipo: {
        type: String,
        enum: ["alerta", "sugerencia", "recordatorio"],
        default: "sugerencia"
    },

    icono: {
        type: String,
        default: "💡"
    },

    titulo: {
        type: String,
        required: true
    },

    descripcion: {
        type: String,
        required: true
    },

    leida: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Sugerencia", sugerenciaSchema);
