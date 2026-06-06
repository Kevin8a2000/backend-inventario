const express = require("express");

const router = express.Router();

const verificarToken =
require("../middlewares/auth");

const {
    obtenerRecomendacionesIA,
    getSugerencias,
    marcarLeida,
    marcarTodasLeidas
} = require("../controllers/ai.controller");

// =====================================================
// 🤖 IA INVENTARIO
// =====================================================

router.get(

    "/recomendaciones",

    verificarToken,

    obtenerRecomendacionesIA
);

// =====================================================
// 💾 SUGERENCIAS PERSISTENTES
// =====================================================

router.get("/suggestions",              verificarToken, getSugerencias);
router.patch("/suggestions/:id/read",   verificarToken, marcarLeida);
router.post("/suggestions/read-all",    verificarToken, marcarTodasLeidas);

module.exports = router;