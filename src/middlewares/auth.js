const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ error: "Acceso denegado" });
        }

        const decoded = jwt.verify(token, "secreto123");

        req.usuario = decoded;

        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

module.exports = verificarToken;