const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");

const {
    obtenerProductos,
    crearProducto,
    obtenerStockBajo,
    obtenerValorInventario,
    actualizarProducto,
    eliminarProducto
} = require("../controllers/productos.controller");

const validarProducto = require("../middlewares/validarProducto");
const verificarToken = require("../middlewares/auth");

// GET todos
router.get("/", obtenerProductos);

// TOTAL PRODUCTOS
router.get("/total", verificarToken, async (req, res) => {
    try {
        const total = await Producto.countDocuments();

        res.json({
            total
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al contar productos"
        });
    }
});

// 🟣 STOCK BAJO (NUEVA RUTA)
router.get("/stock-bajo", verificarToken, obtenerStockBajo);

router.get("/valor-inventario", verificarToken, obtenerValorInventario);

// 🟣 STOCK POR CATEGORÍA (NUEVO 🔥)
router.get("/stock-por-categoria", verificarToken, async (req, res) => {
    try {
        const resultado = await Producto.aggregate([
            {
                $lookup: {
                    from: "categorias",
                    localField: "categoria",
                    foreignField: "_id",
                    as: "categoriaInfo"
                }
            },
            {
                $unwind: "$categoriaInfo"
            },
            {
                $group: {
                    _id: "$categoriaInfo.nombre",
                    totalStock: { $sum: "$stock" }
                }
            }
        ]);

        res.json(resultado);

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener stock por categoría"
        });
    }
});

// GET por ID
router.get("/:id", async (req, res) => {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
});

// 🔒 POST protegido
router.post("/", verificarToken, validarProducto, crearProducto);

// 🔒 PUT protegido
router.put("/:id", verificarToken, validarProducto, actualizarProducto);

// 🔒 DELETE protegido
router.delete("/:id", verificarToken, eliminarProducto);

module.exports = router;


