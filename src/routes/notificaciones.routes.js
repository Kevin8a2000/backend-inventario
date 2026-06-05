const express = require("express");

const router = express.Router();

const verificarToken =
require("../middlewares/auth");

const {

    obtenerNotificaciones,

    obtenerNoLeidas,

    marcarLeida,

    marcarTodasLeidas,

    eliminarNotificacion

} = require(
    "../controllers/notificaciones.controller"
);

// =====================================================
// 🔔 OBTENER NOTIFICACIONES
// =====================================================

router.get(
    "/",
    verificarToken,
    obtenerNotificaciones
);

// =====================================================
// 🔴 CONTADOR NO LEÍDAS
// =====================================================

router.get(
    "/no-leidas",
    verificarToken,
    obtenerNoLeidas
);

// =====================================================
// ✅ MARCAR COMO LEÍDA
// =====================================================

router.put(
    "/:id/leida",
    verificarToken,
    marcarLeida
);

// =====================================================
// ✅ MARCAR TODAS COMO LEÍDAS
// =====================================================

router.put(
    "/marcar-todas",
    verificarToken,
    marcarTodasLeidas
);

// =====================================================
// 🗑️ ELIMINAR NOTIFICACIÓN
// =====================================================

router.delete(
    "/:id",
    verificarToken,
    eliminarNotificacion
);

module.exports = router;