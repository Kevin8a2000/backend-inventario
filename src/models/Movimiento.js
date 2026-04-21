const mongoose = require("mongoose");

const movimientoSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true
    },
    tipo: {
        type: String,
        enum: ["entrada", "salida"],
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario"
    }
}, {
    timestamps: true // 🔥 crea createdAt y updatedAt automáticamente
});

module.exports = mongoose.model("Movimiento", movimientoSchema);