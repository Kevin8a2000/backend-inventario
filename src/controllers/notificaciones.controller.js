const Notificacion =
require("../models/Notificacion");

// =====================================================
// 🔔 OBTENER NOTIFICACIONES
// =====================================================

exports.obtenerNotificaciones =
async (req, res) => {

    try {

        const notificaciones =
            await Notificacion.find()
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notificaciones);

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al obtener notificaciones"
        });
    }
};

// =====================================================
// 🔴 CONTADOR NO LEÍDAS
// =====================================================

exports.obtenerNoLeidas =
async (req, res) => {

    try {

        const total =
            await Notificacion.countDocuments({

                leida: false
            });

        res.json({
            total
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al contar notificaciones"
        });
    }
};

// =====================================================
// ✅ MARCAR COMO LEÍDA
// =====================================================

exports.marcarLeida =
async (req, res) => {

    try {

        const notificacion =
            await Notificacion.findByIdAndUpdate(

                req.params.id,

                {
                    leida: true
                },

                {
                    new: true
                }
            );

        if (!notificacion) {

            return res.status(404).json({

                error:
                    "Notificación no encontrada"
            });
        }

        res.json({

            mensaje:
                "Notificación marcada como leída"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al actualizar notificación"
        });
    }
};

// =====================================================
// ✅ MARCAR TODAS COMO LEÍDAS
// =====================================================

exports.marcarTodasLeidas =
async (req, res) => {

    try {

        await Notificacion.updateMany(

            {
                leida: false
            },

            {
                leida: true
            }
        );

        res.json({

            mensaje:
                "Todas las notificaciones fueron leídas"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al actualizar notificaciones"
        });
    }
};

// =====================================================
// 🗑️ ELIMINAR NOTIFICACIÓN
// =====================================================

exports.eliminarNotificacion =
async (req, res) => {

    try {

        const notificacion =
            await Notificacion.findByIdAndDelete(
                req.params.id
            );

        if (!notificacion) {

            return res.status(404).json({

                error:
                    "Notificación no encontrada"
            });
        }

        res.json({

            mensaje:
                "Notificación eliminada"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error al eliminar notificación"
        });
    }
};