const Usuario = require("../models/Usuario");

// 🔹 OBTENER TODOS LOS USUARIOS
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

// 🔹 ACTUALIZAR USUARIO
const actualizarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(usuario);

    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
};

module.exports = {
    obtenerUsuarios,
    actualizarUsuario
};