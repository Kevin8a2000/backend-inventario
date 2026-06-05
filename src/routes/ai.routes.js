const express = require("express");

const router = express.Router();

const verificarToken =
require("../middlewares/auth");

const {

    obtenerRecomendacionesIA

} = require(
    "../controllers/ai.controller"
);

// =====================================================
// 🤖 IA INVENTARIO
// =====================================================

router.get(

    "/recomendaciones",

    verificarToken,

    obtenerRecomendacionesIA
);

// Alias para compatibilidad con el frontend
router.get("/suggestions", verificarToken, obtenerRecomendacionesIA);

// Marcar sugerencia como leída (el frontend envía PATCH)
router.patch("/suggestions/:id/read", verificarToken, async (req, res) => {
    // Las sugerencias de IA son generadas dinámicamente, no se persisten
    // Solo retornar OK para que el frontend no falle
    res.json({ ok: true, mensaje: "Marcado como leído" });
});

// Marcar todas como leídas
router.post("/suggestions/read-all", verificarToken, async (req, res) => {
    res.json({ ok: true, mensaje: "Todas marcadas como leídas" });
});

module.exports = router;