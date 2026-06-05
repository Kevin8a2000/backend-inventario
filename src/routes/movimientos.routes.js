const express = require("express");
const router = express.Router();

const Movimiento = require("../models/Movimiento");

const {
    crearMovimiento,
    getMovimientos,
    obtenerResumenMovimientos
} = require("../controllers/movimientos.controller");

const verificarToken = require("../middlewares/auth");
const { validarMovimiento } = require("../middlewares/validarInputs");

// CREAR MOVIMIENTO
router.post("/", verificarToken, validarMovimiento, crearMovimiento);

// 🟣 MOVIMIENTOS DE HOY (NUEVO)
router.get("/hoy", verificarToken, async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const total = await Movimiento.countDocuments({
            createdAt: { $gte: hoy }
        });

        res.json({ total });

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener movimientos de hoy"
        });
    }
});

// OBTENER MOVIMIENTOS
router.get("/", verificarToken, async (req, res) => {

    try {

        const { search } = req.query;

        const movimientos = await Movimiento.find()
            .populate("producto")
            .sort({ createdAt: -1 });

        // 🔥 SI NO HAY SEARCH
        if (!search) {

            return res.json(movimientos);
        }

        // � SANITIZAR BÚSQUEDA (XSS Prevention)
        const searchLimpio = typeof search === 'string' 
            ? search.trim().toLowerCase()
            : '';

        if (!searchLimpio) {
            return res.json(movimientos);
        }

        // 🔥 FILTRO
        const filtrados = movimientos.filter(mov => {

            const nombreProducto =
                mov.producto?.nombre?.toLowerCase() || "";

            const tipo =
                mov.tipo?.toLowerCase() || "";

            return (
                nombreProducto.includes(searchLimpio) ||
                tipo.includes(searchLimpio)
            );
        });

        res.json(filtrados);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Error al obtener movimientos"
        });
    }
});

// 🟣 RESUMEN (ENTRADAS VS SALIDAS)
router.get("/resumen", verificarToken, obtenerResumenMovimientos);

module.exports = router;