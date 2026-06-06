const generarPDF =
require("../utils/pdfGenerator");

const { enviarCorreo } =
require("../utils/email");

const { validarRangoFechas } =
require("../utils/validadores");

const generarReportePDF = async (req, res) => {

    try {

        const { email, ...filtros } = req.body;

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

        console.log("📄 FILTROS REPORTE:", filtros);

        // =====================================================
        // 🔥 GENERAR PDF
        // =====================================================

        const pdfBuffer = await generarPDF(filtros);

        // =====================================================
        // 📧 ENVIAR CORREO (si viene email)
        // =====================================================

        if (email) {
            enviarCorreo(
                email,
                "📊 Reporte de Inventario",
                "Adjunto encontrarás el reporte PDF generado.",
                {
                    filename: `reporte-invenstock-${new Date().toISOString().split("T")[0]}.pdf`,
                    content: pdfBuffer
                }
            ).catch(err => console.error("❌ Error enviando reporte por correo:", err.message));
        }

        // =====================================================
        // ✅ DEVOLVER PDF PARA DESCARGA
        // =====================================================

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=reporte-invenstock.pdf");
        return res.send(pdfBuffer);

    } catch (error) {

        console.log("❌ ERROR CONTROLLER:", error);

        res.status(400).json({
            ok: false,
            error: error.message || "Error generando reporte"
        });
    }
};

module.exports = {
    generarReportePDF
};