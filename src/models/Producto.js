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
        codigo: {
            type: String,
            default: 'N/A'
        },
        fechaEntrada: {
            type: Date,
            default: Date.now
        },
        usaVencimiento: {
            type: Boolean,
            default: false
        },
        fechaVencimiento: {
            type: Date,
            required: false  // 👈 no obligatorio
        },
        diasAlerta: {
            type: Number,
            default: 30
        },
        observacion: {
            type: String,
            default: ''
        }
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

    lotes: [{
        codigo:           { type: String, default: 'S/N' },
        stock:            { type: Number, default: 0, min: 0 },
        fechaEntrada:     { type: Date,   default: Date.now },
        fechaVencimiento: { type: Date,   default: null },
        observacion:      { type: String, default: '' }
    }],

    diasAlerta: {
        type: Number,
        default: 30,
        min: 0
    },

    disponible: {
        type: Boolean,
        default: true
    },

    imagen: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Producto", productoSchema);