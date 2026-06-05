const express = require("express");

const router = express.Router();

// 🔐 MIDDLEWARES
const verificarToken =
require("../middlewares/auth");

const verificarPermiso =
require("../middlewares/verificarPermiso");

// 🔥 CONTROLLER
const {
    generarReportePDF
} = require("../controllers/reportes.controller");

// =====================================================
// 📄 GENERAR REPORTE PDF
// =====================================================

router.post(

    "/",

    verificarToken,

    verificarPermiso(
        "ver_reportes"
    ),

    generarReportePDF
);

module.exports = router;