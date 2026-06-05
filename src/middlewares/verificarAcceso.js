// =====================================================
// 🔒 MIDDLEWARE - CONTROL DE ACCESO POR USUARIO
// =====================================================

const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

// =====================================================
// ✅ VERIFICAR QUE EL USUARIO SOLO ACCEDA SUS RECURSOS
// =====================================================

const verificarAccesoUsuario = async (req, res, next) => {
    try {
        const usuarioIdParam = req.params.id;
        const usuarioIdToken = req.usuario.id;

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(usuarioIdParam)) {
            return res.status(400).json({
                ok: false,
                error: "ID de usuario inválido"
            });
        }

        // Los admin pueden acceder a cualquier usuario
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Los usuarios regulares solo pueden acceder a su propio perfil
        if (usuarioIdParam !== usuarioIdToken) {
            return res.status(403).json({
                ok: false,
                error: "No tienes permiso para acceder a este recurso"
            });
        }

        next();
    } catch (error) {
        console.error("❌ Error en verificarAccesoUsuario:", error);
        return res.status(500).json({
            ok: false,
            error: "Error verificando acceso"
        });
    }
};

// =====================================================
// ✅ VERIFICAR ADMIN
// =====================================================

const verificarAdmin = (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                error: "No autenticado"
            });
        }

        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                ok: false,
                error: "Se requieren permisos de administrador"
            });
        }

        next();
    } catch (error) {
        console.error("❌ Error en verificarAdmin:", error);
        return res.status(500).json({
            ok: false,
            error: "Error verificando permisos"
        });
    }
};

module.exports = {
    verificarAccesoUsuario,
    verificarAdmin
};
