const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },

    descripcion: {
        type: String,
        default: ""
    },

    sku: {
        type: String,
        required: true,
        unique: true
    },

    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categoria"
    },

    precio: {
        type: Number,
        required: true
    },

    stock: {
        type: Number,
        default: 0
    },

    stockMinimo: {
        type: Number,
        default: 0
    },

    // AQUÍ VA EL NUEVO CAMPO
    movimientoMaximo: {
        type: Number,
        default: 50
    },

    disponible: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Producto", productoSchema);