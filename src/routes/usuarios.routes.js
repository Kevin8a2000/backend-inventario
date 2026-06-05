const express = require("express");

const Usuario = require("../models/Usuario");
const { escaparHTML, limitarLongitud } = require("../utils/sanitizar");
const router = express.Router();

const {

    obtenerUsuarios,

    obtenerUsuarioPorId,

    actualizarUsuario,

    actualizarPermisos,

    eliminarUsuario

} = require(
    "../controllers/usuarios.controller"
);

const verificarToken =
require("../middlewares/auth");

const verificarPermiso =
require("../middlewares/verificarPermiso");

const validarObjectId =
require("../middlewares/validarObjectId");

// =====================================================
// 🔥 PERFIL DE USUARIO
// =====================================================

// GET perfil del usuario autenticado
router.get("/perfil", verificarToken, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select("-password");
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        res.json({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.email,
            cargo: usuario.cargo || usuario.rol,
            ubicacion: usuario.ubicacion || "",
            fotoPerfil: usuario.fotoPerfil || null
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// PUT actualizar perfil del usuario autenticado
router.put("/perfil", verificarToken, async (req, res) => {
    try {
        const { nombre, cargo, ubicacion, fotoPerfil } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        if (nombre) usuario.nombre = escaparHTML(limitarLongitud(nombre, 50));
        if (cargo) usuario.cargo = escaparHTML(limitarLongitud(cargo, 50));
        if (ubicacion !== undefined) usuario.ubicacion = escaparHTML(limitarLongitud(ubicacion, 100));
        if (fotoPerfil !== undefined) usuario.fotoPerfil = fotoPerfil;

        await usuario.save();
        res.json({ mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
});

// =====================================================
// 🔥 OBTENER TODOS LOS USUARIOS
// =====================================================

router.get(

    "/",

    verificarToken,

    verificarPermiso(
        "gestionar_usuarios"
    ),

    obtenerUsuarios
);

// =====================================================
// 🔥 OBTENER USUARIO POR ID
// =====================================================

// Permite acceso solo al propio usuario o a administradores
router.get(
    "/:id",
    verificarToken,
    validarObjectId,
    (req, res, next) => {
        try {
            // admin puede acceder a cualquier usuario
            if (req.usuario && req.usuario.rol === 'admin') return next();

            // usuario normal sólo puede acceder a su propio recurso
            if (req.usuario && req.usuario.id === req.params.id) return next();

            return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
        } catch (err) {
            console.error('Error en control de acceso GET /:id', err);
            return res.status(500).json({ error: 'Error verificando permisos' });
        }
    },
    obtenerUsuarioPorId
);

// =====================================================
// 🔥 ACTUALIZAR USUARIO
// =====================================================

router.put(

    "/:id",

    verificarToken,

    validarObjectId,
    // Solo admin o el propio usuario pueden actualizar
    (req, res, next) => {
        try {
            if (req.usuario && (req.usuario.rol === 'admin' || req.usuario.id === req.params.id)) return next();
            return res.status(403).json({ error: 'No tienes permiso para modificar este usuario' });
        } catch (err) {
            console.error('Error en control de acceso PUT /:id', err);
            return res.status(500).json({ error: 'Error verificando permisos' });
        }
    },
    actualizarUsuario
);

// =====================================================
// 🔥 ACTUALIZAR PERMISOS
// =====================================================

router.put(

    "/:id/permisos",

    verificarToken,

    validarObjectId,

    verificarPermiso(
        "gestionar_usuarios"
    ),

    async (req, res) => {

        try {

            const Usuario =
                require("../models/Usuario");

            const usuario =
                await Usuario.findById(
                    req.params.id
                );

            if (!usuario) {

                return res.status(404).json({

                    error:
                        "Usuario no encontrado"
                });
            }

            // =====================================================
            // 🔥 OBTENER PERMISOS
            // =====================================================

            const {

                permisos

            } = req.body;

            // =====================================================
            // ✅ VALIDAR ARRAY
            // =====================================================

            if (!Array.isArray(permisos)) {

                return res.status(400).json({

                    error:
                        "Los permisos deben ser un array"
                });
            }

            // =====================================================
            // � WHITELIST - Validar permisos permitidos
            // =====================================================

            const permisosValidos = [
                "ver_productos",
                "crear_producto",
                "editar_producto",
                "eliminar_producto",
                "ver_reportes",
                "gestionar_usuarios",
                "crear_lote",
                "editar_lote"
            ];

            const permisosLimpios = permisos.filter(p => 
                typeof p === 'string' && permisosValidos.includes(p)
            );

            // =====================================================
            // 🔥 ADMIN SIEMPRE TIENE TODO
            // =====================================================

            if (usuario.rol === "admin") {

                usuario.permisos = ["*"];

            } else {

                // =====================================================
                // ✅ GUARDAR NUEVOS PERMISOS (validados)
                // =====================================================

                usuario.permisos = permisosLimpios;
            }

            // =====================================================
            // 💾 GUARDAR
            // =====================================================

            await usuario.save();

            // =====================================================
            // ✅ RESPUESTA
            // =====================================================

            res.json({

                mensaje:
                    "Permisos actualizados correctamente",

                usuario
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({

                error:
                    "Error al actualizar permisos"
            });
        }
    }
);

// =====================================================
// 🔥 RESETEAR PERMISOS
// 🔥 DEJAR USUARIO NORMAL
// =====================================================

router.put(

    "/:id/reset-permisos",

    verificarToken,

    verificarPermiso(
        "gestionar_usuarios"
    ),

    async (req, res) => {

        try {

            const Usuario =
                require("../models/Usuario");

            const usuario =
                await Usuario.findById(
                    req.params.id
                );

            if (!usuario) {

                return res.status(404).json({

                    error:
                        "Usuario no encontrado"
                });
            }

            // =====================================================
            // 🔥 ADMIN NO SE PUEDE RESETEAR
            // =====================================================

            if (usuario.rol === "admin") {

                return res.status(400).json({

                    error:
                        "No se pueden resetear permisos de administradores"
                });
            }

            // =====================================================
            // 🔥 ELIMINAR TODOS LOS PERMISOS
            // =====================================================

            usuario.permisos = [];

            await usuario.save();

            // =====================================================
            // ✅ RESPUESTA
            // =====================================================

            res.json({

                mensaje:
                    "Permisos eliminados correctamente",

                usuario
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({

                error:
                    "Error al resetear permisos"
            });
        }
    }
);

// =====================================================
// 🔥 ELIMINAR USUARIO
// =====================================================

router.delete(

    "/:id",

    verificarToken,

    validarObjectId,

    verificarPermiso(
        "gestionar_usuarios"
    ),

    eliminarUsuario
);

module.exports = router;