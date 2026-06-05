const generarPDF =
require("../utils/pdfGenerator");

const { enviarCorreo } =
require("../utils/email");

const { validarRangoFechas } =
require("../utils/validadores");

const generarReportePDF = async (req, res) => {

    try {

        // =====================================================
        // 🔥 RECIBIR FILTROS DESDE BODY
        // =====================================================

        const filtros = {

            fechaInicio:
                req.body.fechaInicio,

            fechaFin:
                req.body.fechaFin,

            tipo:
                req.body.tipo,

            categoria:
                req.body.categoria,

            producto:
                req.body.producto,

            orden:
                req.body.orden,

            // 📧 EMAIL OPCIONAL
            email:
                req.body.email,

            // 🔥 SWITCH EMAIL
            enviarPorCorreo:
                req.body.enviarCorreo === true
        };

        // =====================================================
        // ✅ VALIDAR FECHAS (si se proporcionan)
        // =====================================================

        if (filtros.fechaInicio && filtros.fechaFin) {
            if (!validarRangoFechas(filtros.fechaInicio, filtros.fechaFin)) {
                return res.status(400).json({
                    ok: false,
                    error: "Las fechas son inválidas o el rango es incorrecto"
                });
            }
        }

        console.log(
            "📄 FILTROS REPORTE:",
            filtros
        );

        // =====================================================
        // 🔥 GENERAR PDF
        // =====================================================

        const pdfBuffer =
            await generarPDF(filtros);

        // =====================================================
        // 📧 ENVIAR CORREO
        // =====================================================

        if (filtros.enviarPorCorreo) {

            // 🔥 SI NO ENVÍAN EMAIL
            // USA EMAIL_TO AUTOMÁTICO

            const correoDestino =
                filtros.email ||
                process.env.EMAIL_TO;

            if (!correoDestino) {

                return res.status(400).json({

                    ok: false,

                    mensaje:
                        "No hay correo configurado"
                });
            }

            await enviarCorreo(

                correoDestino,

                "📊 Reporte de Inventario",

                "Adjunto encontrarás el reporte PDF generado.",

                {
                    filename: "reporte.pdf",

                    content: pdfBuffer
                }
            );

            // =====================================================
            // ✅ RESPUESTA SI ENVÍA CORREO
            // =====================================================

            return res.status(200).json({

                ok: true,

                mensaje:
                    "Reporte enviado correctamente al correo",

                enviadoCorreo: true
            });
        }

        // =====================================================
        // ✅ RESPUESTA SI SOLO GENERA PDF
        // =====================================================

        return res.status(200).json({

            ok: true,

            mensaje:
                "PDF generado correctamente",

            enviadoCorreo: false
        });

    } catch (error) {

        console.log(
            "❌ ERROR CONTROLLER:",
            error
        );

        res.status(500).json({

            ok: false,

            error:
                "Error generando reporte"
        });
    }
};

module.exports = {
    generarReportePDF
};