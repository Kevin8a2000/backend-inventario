const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
// 🔔 CONFIGURACIÓN DE NOTIFICACIONES
    notificaciones: {
        stockBajo: { type: Boolean, default: true },
        stockAgotado: { type: Boolean, default: true },
        movimientoGrande: { type: Boolean, default: true }
    }
    
});

module.exports = mongoose.model("Usuario", usuarioSchema);