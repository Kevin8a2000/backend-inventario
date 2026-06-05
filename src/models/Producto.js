const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    descripcion: {
        type: String,
        default: "",
        trim: true
    },

    marca: {
        type: String,
        default: "",
        trim: true
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categoria",
        required: true
    },

    precio: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        default: 0,
        min: 0
    },

    stockMinimo: {
        type: Number,
        default: 0,
        min: 0
    },

    movimientoMaximo: {
        type: Number,
        default: 50,
        min: 1
    },

    usaLotes: {
        type: Boolean,
        default: false
    },

    lote: {
        type: String,
        default: "",
        trim: true
    },

    fechaVencimiento: {
        type: Date,
        default: null
    },

    observacionLote: {
        type: String,
        default: "",
        trim: true
    },

    diasAlerta: {
        type: Number,
        default: 30,
        min: 0
    },

    disponible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Producto", productoSchema);