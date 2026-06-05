const express = require("express");
const router = express.Router();

const {
  crearCategoria,
  obtenerCategorias
} = require("../controllers/categorias.controller");

const {
  validarCategoria
} = require("../middlewares/validarInputs");

// 🔐 Middleware de autenticación
const auth = require("../middlewares/auth");

// Crear categoría
router.post("/", auth, validarCategoria, crearCategoria);

// Obtener categorías
router.get("/", auth, obtenerCategorias);

module.exports = router;