const express = require("express");
const router = express.Router();

const Movimiento = require("../models/Movimiento");

const {
    crearMovimiento,
    getMovimientos,
    obtenerResumenMovimientos
} = require("../controllers/movimientos.controller");

const verificarToken = require("../middlewares/auth");

// CREAR MOVIMIENTO
router.post("/", verificarToken, crearMovimiento);

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
router.get("/", verificarToken, getMovimientos);

// 🟣 RESUMEN (ENTRADAS VS SALIDAS)
router.get("/resumen", verificarToken, obtenerResumenMovimientos);

module.exports = router;