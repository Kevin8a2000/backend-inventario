const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTRO
const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, confirmPassword } = req.body;

         // 🟣 1. VALIDAR CAMPOS VACÍOS (AQUÍ VA)
        if (!nombre || !apellido || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // ✅ VALIDAR CONTRASEÑA PRIMERO
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Las contraseñas no coinciden" });
        }

        // ✅ VALIDAR SI YA EXISTE EL USUARIO
        const existe = await Usuario.findOne({ email });

        if (existe) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        const hash = await bcrypt.hash(password, 10);

        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password: hash
        });

        await usuario.save();

        res.status(201).json({ mensaje: "Usuario creado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en registro" });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(400).json({ error: "Usuario no existe" });
        }

        const valido = await bcrypt.compare(password, usuario.password);

        if (!valido) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario._id },
            "secreto123",
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Error en login" });
    }
};

module.exports = { register, login };