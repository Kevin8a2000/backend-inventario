module.exports = (permisoRequerido) => {

    return (req, res, next) => {

        try {

            // =====================================================
            // ✅ VALIDAR USUARIO
            // =====================================================

            if (!req.usuario) {

                return res.status(401).json({

                    error: "Usuario no autenticado"
                });
            }

            // =====================================================
            // ✅ ADMIN TIENE ACCESO TOTAL
            // =====================================================

            if (

                req.usuario.rol === "admin"

                ||

                req.usuario.permisos?.includes("*")

            ) {

                return next();
            }

            // =====================================================
            // ✅ VALIDAR ARRAY DE PERMISOS
            // =====================================================

            const permisos =
                req.usuario.permisos || [];

            // =====================================================
            // ❌ SIN PERMISO
            // =====================================================

            if (

                !permisos.includes(
                    permisoRequerido
                )

            ) {

                return res.status(403).json({

                    error:
                        "No tienes permisos para realizar esta acción"
                });
            }

            // =====================================================
            // ✅ CONTINUAR
            // =====================================================

            next();

        } catch (error) {

            console.log(error);

            res.status(500).json({

                error:
                    "Error verificando permisos"
            });
        }
    };
};