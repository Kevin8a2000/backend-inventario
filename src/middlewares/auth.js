const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {

    try {

        // =====================================================
        // 🔐 OBTENER HEADER
        // =====================================================

        const authHeader =
            req.header("Authorization");

        if (!authHeader) {

            return res.status(401).json({
                error: "Acceso denegado"
            });
        }

        // =====================================================
        // 🔥 EXTRAER TOKEN
        // =====================================================

        const token =
            authHeader.split(" ")[1];

        if (!token) {

            return res.status(401).json({
                error: "Token requerido"
            });
        }

        // =====================================================
        // 🔐 VALIDAR TOKEN
        // =====================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.usuario = decoded;

        next();

    } catch (error) {

        // Solo loguear en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.error("🔐 Token Error:", error.message);
        }

        res.status(401).json({
            error: "Token inválido"
        });
    }
};

module.exports = verificarToken;