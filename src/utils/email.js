const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || "InvStock La Costa <onboarding@resend.dev>";

// =====================================================
// 🎨 TEMPLATE
// =====================================================

const generarTemplate = (titulo, mensaje, botonTexto = null, botonLink = null) => {

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>${titulo}</title>
    </head>
    <body style="margin:0;padding:0;background:#03113a;font-family:Arial,sans-serif;">
        <div style="width:100%;background:#03113a;padding:40px 0;">
            <div style="width:100%;max-width:1600px;margin:auto;text-align:center;">

                <div style="margin-bottom:30px;">
                    <img src='https://i.imgur.com/iQPOUXh.jpeg' width='420'
                        style='opacity:0.13;display:block;margin:auto;' />
                </div>

                <div style="margin-top:10px;">
                    <h1 style="color:#38bdf8;font-size:28px;margin:0;font-weight:bold;">
                        ${titulo}
                    </h1>
                </div>

                <div style="margin-top:22px;margin-bottom:30px;">
                    <p style="color:#ffffff;font-size:14px;margin:0;font-weight:500;">
                        ${mensaje}
                    </p>
                </div>

                ${botonTexto && botonLink ? `
                <div style="margin-top:25px;">
                    <a href="${botonLink}" style="background:#38bdf8;color:white;text-decoration:none;
                        padding:14px 28px;border-radius:10px;display:inline-block;
                        font-size:15px;font-weight:bold;">
                        ${botonTexto}
                    </a>
                </div>
                ` : ""}

                <div style="width:95%;margin:auto;margin-top:45px;background:#202c46;
                    border-radius:12px;padding:28px 20px;box-sizing:border-box;">
                    <p style="color:white;font-size:15px;margin:0;margin-bottom:18px;font-weight:bold;">
                        📅 Fecha: ${new Date().toLocaleString()}
                    </p>
                    <p style="color:white;font-size:15px;margin:0;font-weight:bold;">
                        📦 Sistema: InvStock La Costa
                    </p>
                </div>

                <div style="margin-top:28px;color:#cbd5e1;font-size:12px;">
                    Este es un correo automático del sistema
                </div>

            </div>
        </div>
    </body>
    </html>
    `;
};

// =====================================================
// 📧 ENVIAR CORREO GENÉRICO
// =====================================================

const enviarCorreo = async (destinatario, asunto, mensaje, archivoAdjunto = null) => {

    try {

        const html = generarTemplate("📊 Reporte de Inventario", mensaje);

        const payload = {
            from: FROM,
            to: destinatario,
            subject: asunto,
            html
        };

        if (archivoAdjunto) {
            payload.attachments = [{
                filename: archivoAdjunto.filename,
                content: archivoAdjunto.content
            }];
        }

        await resend.emails.send(payload);

        console.log(`📧 Correo enviado a ${destinatario}`);

    } catch (error) {
        console.log("❌ Error correo:", error.message);
    }
};

// =====================================================
// 🔐 RECUPERACIÓN PASSWORD
// =====================================================

const enviarCorreoRecuperacion = async (destinatario, nombre, token) => {

    try {

        const link = `${process.env.FRONTEND_URL}/restablecer-password/${token}`;

        const mensaje = `
            Hola ${nombre},<br><br>
            Recibimos una solicitud para restablecer tu contraseña.<br><br>
            Presiona el botón para continuar con la recuperación.<br><br>
            ⚠️ Este enlace expirará en 15 minutos.
        `;

        const html = generarTemplate(
            "🔐 Recuperar Contraseña",
            mensaje,
            "Restablecer Contraseña",
            link
        );

        await resend.emails.send({
            from: FROM,
            to: destinatario,
            subject: "🔐 Recuperación de contraseña",
            html
        });

        console.log(`📧 Recuperación enviada a ${destinatario}`);

    } catch (error) {
        console.log("❌ Error recuperación:", error.message);
    }
};

// =====================================================
// ⚠️ ALERTA DE STOCK BAJO
// =====================================================

const enviarCorreoAlertaStock = async (destinatario, productoNombre, stockActual, stockMinimo) => {

    try {

        const mensaje = `
            El producto <strong>${productoNombre}</strong> tiene stock bajo.<br><br>
            <strong>Stock actual:</strong> ${stockActual} unidades<br>
            <strong>Stock mínimo:</strong> ${stockMinimo} unidades<br><br>
            Por favor realiza una reposición a la brevedad.
        `;

        const html = generarTemplate("⚠️ Alerta de Stock Bajo", mensaje);

        await resend.emails.send({
            from: FROM,
            to: destinatario,
            subject: `⚠️ Stock bajo: ${productoNombre}`,
            html
        });

        console.log(`📧 Alerta stock enviada a ${destinatario}`);

    } catch (error) {
        console.log("❌ Error alerta stock:", error.message);
    }
};

// =====================================================
// 📦 REPORTE SEMANAL DE INVENTARIO
// =====================================================

const enviarCorreoReporteSemanal = async (destinatario, nombre, productos) => {

    try {

        const filas = productos.map(p => `
            <tr>
                <td style="padding:8px;border:1px solid #334155;color:#ffffff;">${p.nombre}</td>
                <td style="padding:8px;border:1px solid #334155;color:#ffffff;text-align:center;">${p.stock}</td>
                <td style="padding:8px;border:1px solid #334155;color:#ffffff;text-align:center;">${p.stockMinimo}</td>
                <td style="padding:8px;border:1px solid #334155;text-align:center;
                    color:${p.stock <= p.stockMinimo ? '#f87171' : '#4ade80'};">
                    ${p.stock <= p.stockMinimo ? '⚠️ BAJO' : '✅ OK'}
                </td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8" /><title>Reporte Semanal</title></head>
            <body style="margin:0;padding:0;background:#03113a;font-family:Arial,sans-serif;">
                <div style="width:100%;background:#03113a;padding:40px 0;">
                    <div style="width:95%;max-width:700px;margin:auto;text-align:center;">
                        <img src='https://i.imgur.com/iQPOUXh.jpeg' width='200'
                            style='opacity:0.13;display:block;margin:auto;margin-bottom:20px;' />
                        <h1 style="color:#38bdf8;font-size:24px;margin:0 0 8px;">
                            📦 Reporte Semanal de Inventario
                        </h1>
                        <p style="color:#cbd5e1;margin:0 0 30px;">
                            Hola <strong style="color:#ffffff;">${nombre}</strong>,
                            aquí está el resumen semanal.
                        </p>
                        <div style="background:#202c46;border-radius:12px;padding:24px;text-align:left;">
                            <table style="width:100%;border-collapse:collapse;">
                                <thead>
                                    <tr>
                                        <th style="padding:10px 8px;border:1px solid #334155;color:#38bdf8;background:#1e3a5f;text-align:left;">Producto</th>
                                        <th style="padding:10px 8px;border:1px solid #334155;color:#38bdf8;background:#1e3a5f;text-align:center;">Stock</th>
                                        <th style="padding:10px 8px;border:1px solid #334155;color:#38bdf8;background:#1e3a5f;text-align:center;">Mínimo</th>
                                        <th style="padding:10px 8px;border:1px solid #334155;color:#38bdf8;background:#1e3a5f;text-align:center;">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>${filas}</tbody>
                            </table>
                        </div>
                        <div style="margin-top:28px;background:#202c46;border-radius:12px;padding:20px;">
                            <p style="color:white;font-size:15px;margin:0;font-weight:bold;">
                                📅 Fecha: ${new Date().toLocaleString()}
                            </p>
                            <p style="color:white;font-size:15px;margin:8px 0 0;font-weight:bold;">
                                📦 Sistema: InvStock La Costa
                            </p>
                        </div>
                        <div style="margin-top:20px;color:#cbd5e1;font-size:12px;">
                            Este es un correo automático del sistema
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await resend.emails.send({
            from: FROM,
            to: destinatario,
            subject: '📦 Reporte Semanal de Inventario — InvStock La Costa',
            html
        });

        console.log(`📧 Reporte semanal enviado a ${destinatario}`);

    } catch (error) {
        console.log("❌ Error reporte semanal:", error.message);
    }
};

// =====================================================
// 📧 CAMBIO DE CORREO ELECTRÓNICO
// =====================================================

const enviarCorreoCambioEmail = async (destinatario, nombre, emailNuevo) => {

    try {

        const mensaje = `
            Hola ${nombre},<br><br>
            Te informamos que el correo electrónico asociado a tu cuenta de
            <strong>InvStock La Costa</strong> ha sido actualizado.<br><br>
            <strong>Nuevo correo:</strong> ${emailNuevo}<br><br>
            Si no realizaste este cambio, contacta al administrador inmediatamente.
        `;

        const html = generarTemplate("📧 Cambio de Correo Electrónico", mensaje);

        await resend.emails.send({
            from: FROM,
            to: destinatario,
            subject: "📧 Tu correo electrónico ha sido actualizado",
            html
        });

        console.log(`📧 Notificación de cambio de correo enviada a ${destinatario}`);

    } catch (error) {
        console.log("❌ Error notificación cambio correo:", error.message);
    }
};

// =====================================================
// 🚀 EXPORTS
// =====================================================

module.exports = {
    enviarCorreo,
    enviarCorreoRecuperacion,
    enviarCorreoCambioEmail,
    enviarCorreoAlertaStock,
    enviarCorreoReporteSemanal
};
