const express = require("express");
const router = express.Router();

const {
    obtenerUsuarios,
    actualizarUsuario
} = require("../controllers/usuarios.controller");

const verificarToken = require("../middlewares/auth");

// GET usuarios
router.get("/", verificarToken, obtenerUsuarios);

// PUT usuario
router.put("/:id", verificarToken, actualizarUsuario);

module.exports = router;