const Categoria = require("../models/Categoria");

// 🟢 CREAR CATEGORÍA
const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;

    // Validar campo vacío
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // 🔥 Validar duplicado (BONUS PRO)
    const existe = await Categoria.findOne({ nombre });

    if (existe) {
      return res.status(400).json({ error: "La categoría ya existe" });
    }

    const categoria = new Categoria({ nombre });

    await categoria.save();

    res.status(201).json(categoria);

  } catch (error) {
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

// 🟢 OBTENER CATEGORÍAS
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

module.exports = {
  crearCategoria,
  obtenerCategorias
};