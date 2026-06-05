const Usuario = require("../models/Usuario");
const { escaparHTML, sanitizarEmail, limitarLongitud } = require("../utils/sanitizar");

// =====================================================
// 🔥 OBTENER TODOS LOS USUARIOS
// =====================================================

const obtenerUsuarios =
async (req, res) => {

    try {

        const usuarios =
            await Usuario.find()
            .select("-password");

        res.json(usuarios);

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error obteniendo usuarios"
        });
    }
};

// =====================================================
// 🔥 OBTENER USUARIO POR ID
// =====================================================

const obtenerUsuarioPorId =
async (req, res) => {

    try {

        const usuario =
            await Usuario.findById(
                req.params.id
            ).select("-password");

        if (!usuario) {

            return res.status(404).json({

                error:
                    "Usuario no encontrado"
            });
        }

        res.json(usuario);

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error obteniendo usuario"
        });
    }
};

// =====================================================
// 🔥 ACTUALIZAR PERMISOS
// =====================================================

const actualizarPermisos =
async (req, res) => {

    try {

        const { permisos } =
            req.body;

        const usuario =
            await Usuario.findByIdAndUpdate(

                req.params.id,

                {
                    permisos
                },

                {
                    new: true
                }

            ).select("-password");

        if (!usuario) {

            return res.status(404).json({

                error:
                    "Usuario no encontrado"
            });
        }

        res.json({

            mensaje:
                "Permisos actualizados correctamente",

            usuario
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error actualizando permisos"
        });
    }
};

// =====================================================
// 🔥 ACTUALIZAR USUARIO
// =====================================================

const actualizarUsuario =
async (req, res) => {

    try {

        // =====================================================
        // 🔒 WHITELIST - Solo campos permitidos
        // =====================================================

        const { nombre, apellido, email, notificaciones } = req.body;

        const camposPermitidos = {};

        if (nombre && typeof nombre === 'string') {
            camposPermitidos.nombre = escaparHTML(limitarLongitud(nombre, 50));
        }

        if (apellido && typeof apellido === 'string') {
            camposPermitidos.apellido = escaparHTML(limitarLongitud(apellido, 50));
        }

        if (email && typeof email === 'string') {
            const emailLimpio = sanitizarEmail(email);
            if (!emailLimpio) {
                return res.status(400).json({ error: 'Email inválido' });
            }

            const usuarioExistente = await Usuario.findOne({ email: emailLimpio, _id: { $ne: req.params.id } });
            if (usuarioExistente) {
                return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
            }

            camposPermitidos.email = emailLimpio;
        }

        if (notificaciones && typeof notificaciones === 'object') {
            camposPermitidos.notificaciones = {
                ...notificaciones,
                stockBajo: Boolean(notificaciones.stockBajo),
                stockAgotado: Boolean(notificaciones.stockAgotado),
                movimientoGrande: Boolean(notificaciones.movimientoGrande)
            };
        }

        const usuario =
            await Usuario.findByIdAndUpdate(

                req.params.id,

                camposPermitidos,

                {
                    new: true,
                    runValidators: true
                }
            ).select("-password");

        if (!usuario) {

            return res.status(404).json({

                error:
                    "Usuario no encontrado"
            });
        }

        res.json({

            mensaje:
                "Usuario actualizado correctamente",

            usuario
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al actualizar usuario"
        });
    }
};

// =====================================================
// 🔥 ELIMINAR USUARIO
// =====================================================

const eliminarUsuario =
async (req, res) => {

    try {

        const usuario =
            await Usuario.findByIdAndDelete(
                req.params.id
            );

        if (!usuario) {

            return res.status(404).json({

                error:
                    "Usuario no encontrado"
            });
        }

        res.json({

            mensaje:
                "Usuario eliminado correctamente"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error eliminando usuario"
        });
    }
};

// =====================================================
// 🔥 EXPORTAR
// =====================================================

module.exports = {

    obtenerUsuarios,

    obtenerUsuarioPorId,

    actualizarUsuario,

    actualizarPermisos,

    eliminarUsuario
};