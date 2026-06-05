const express = require("express");

const router = express.Router();
const Usuario = require("../models/Usuario");

const verificarToken =
require("../middlewares/auth");

const verificarPermiso =
require("../middlewares/verificarPermiso");

// =====================================================
// 🔥 LISTA GLOBAL DE PERMISOS
// =====================================================

const permisos = [

    {
        id: "crear_producto",
        nombre: "Crear Productos",
        icono: "➕",
        descripcion:
            "Permite crear productos"
    },

    {
        id: "editar_producto",
        nombre: "Editar Productos",
        icono: "✏️",
        descripcion:
            "Permite editar productos"
    },

    {
        id: "eliminar_producto",
        nombre: "Eliminar Productos",
        icono: "🗑️",
        descripcion:
            "Permite eliminar productos"
    },

    {
        id: "crear_lote",
        nombre: "Gestionar Lotes",
        icono: "📦",
        descripcion:
            "Permite gestionar lotes"
    },

    {
        id: "ver_reportes",
        nombre: "Ver Reportes",
        icono: "📊",
        descripcion:
            "Permite ver reportes"
    },

    {
        id: "gestionar_usuarios",
        nombre: "Gestionar Usuarios",
        icono: "👥",
        descripcion:
            "Permite administrar usuarios"
    }
];

// =====================================================
// 🔥 OBTENER PERMISOS
// =====================================================

router.get(

    "/",

    verificarToken,

    verificarPermiso(
        "gestionar_usuarios"
    ),

    async (req, res) => {

        try {

            res.json(permisos);

        } catch (error) {

            console.log(error);

            res.status(500).json({

                error:
                    "Error al obtener permisos"
            });
        }
    }
);

// Buscar usuario por email y obtener sus permisos
router.get("/usuario", verificarToken, verificarPermiso("gestionar_usuarios"), async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email requerido" });

        const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select("-password");
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            permisos: usuario.permisos || []
        });
    } catch (error) {
        res.status(500).json({ error: "Error al buscar usuario" });
    }
});

// Actualizar permisos por email
router.put("/usuario", verificarToken, verificarPermiso("gestionar_usuarios"), async (req, res) => {
    try {
        const { email, permisos } = req.body;
        if (!email) return res.status(400).json({ error: "Email requerido" });

        const permisosValidos = [
            "ver_productos", "crear_producto", "editar_producto",
            "eliminar_producto", "ver_reportes", "gestionar_usuarios",
            "crear_lote", "editar_lote"
        ];

        const permisosLimpios = (permisos || []).filter(p =>
            typeof p === "string" && permisosValidos.includes(p)
        );

        const usuario = await Usuario.findOneAndUpdate(
            { email: email.toLowerCase() },
            { permisos: permisosLimpios },
            { new: true }
        ).select("-password");

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json({ mensaje: "Permisos actualizados", usuario });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar permisos" });
    }
});

module.exports = router;