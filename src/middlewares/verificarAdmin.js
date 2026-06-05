const verificarPermiso = (permisoRequerido) => {

    return (req, res, next) => {

        try {

            // =====================================================
            // 👤 VALIDAR USUARIO
            // =====================================================

            if (!req.usuario) {

                return res.status(401).json({

                    ok: false,

                    mensaje: "Usuario no autenticado"
                });
            }

            // =====================================================
            // 👑 ADMIN TIENE ACCESO TOTAL
            // =====================================================

            if (
                req.usuario.rol === "admin" ||
                req.usuario.permisos?.includes("*")
            ) {

                return next();
            }

            // =====================================================
            // 🔐 VALIDAR PERMISO
            // =====================================================

            const tienePermiso =
                req.usuario.permisos?.includes(
                    permisoRequerido
                );

            if (!tienePermiso) {

                return res.status(403).json({

                    ok: false,

                    mensaje:
                        "No tienes permisos para realizar esta acción"
                });
            }

            // =====================================================
            // ✅ CONTINUAR
            // =====================================================

            next();

        } catch (error) {

            console.log(error);

            return res.status(500).json({

                ok: false,

                mensaje:
                    "Error verificando permisos"
            });
        }
    };
};

module.exports = verificarPermiso;