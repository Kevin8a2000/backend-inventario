const express = require("express");
const router = express.Router();

const {
  crearCategoria,
  obtenerCategorias
} = require("../controllers/categorias.controller");

// 🔐 Middleware de autenticación
const auth = require("../middlewares/auth");

// Crear categoría
router.post("/", auth, crearCategoria);

// Obtener categorías
router.get("/", auth, obtenerCategorias);

module.exports = router;