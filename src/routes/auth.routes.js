const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
    validarRegistro,
    validarLogin,
    validarRecuperarPassword,
    validarResetPassword
} = require("../middlewares/validarInputs");

const {
    register,
    login,
    recuperarPassword,
    resetPassword,
    changeEmail
} = require("../controllers/auth.controller");

const verificarToken = require("../middlewares/auth");

// =====================================================
// 🔒 RATE LIMITER PARA AUTH
// =====================================================

const limiterAuth = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,
    message: {
        ok: false,
        error: "Demasiados intentos de autenticación. Espera 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // Skip rate limiting for OPTIONS requests
        return req.method === 'OPTIONS';
    }
});

// Limiter específico para recuperación (3 intentos / 15 min)
const limiterRecuperar = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        ok: false,
        error: "Demasiados intentos de recuperación. Espera 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// =====================================================
// ✅ LOGIN / REGISTER CON VALIDACIÓN
// =====================================================

router.post(
    "/register",
    limiterAuth,
    validarRegistro,
    register
);

router.post(
    "/login",
    limiterAuth,
    validarLogin,
    login
);

// =====================================================
// 🔥 RECUPERAR PASSWORD
// =====================================================

router.post(
    "/recuperar-password",
    limiterRecuperar,
    validarRecuperarPassword,
    recuperarPassword
);

// =====================================================
// 🔥 RESET PASSWORD
// =====================================================

router.post(
    "/reset-password/:token",
    validarResetPassword,
    resetPassword
);

// =====================================================
// 📧 CAMBIO DE EMAIL
// =====================================================

router.put(
    "/change-email",
    verificarToken,
    changeEmail
);

module.exports = router;