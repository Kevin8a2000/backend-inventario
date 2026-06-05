const nodemailer = require("nodemailer");

// =====================================================
// 🚀 TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS
    }
});

// =====================================================
// 🎨 TEMPLATE EXACTO ESTILO ORIGINAL
// =====================================================

const generarTemplate = (

    titulo,
    mensaje,
    botonTexto = null,
    botonLink = null

) => {

    return `

    <!DOCTYPE html>

    <html lang="es">

    <head>

        <meta charset="UTF-8" />

        <title>${titulo}</title>

    </head>

    <body style="
        margin:0;
        padding:0;
        background:#03113a;
        font-family:Arial,sans-serif;
    ">

        <div style="
            width:100%;
            background:#03113a;
            padding:40px 0;
        ">

            <div style="
                width:100%;
                max-width:1600px;
                margin:auto;
                text-align:center;
            ">

                <!-- LOGO GRANDE FONDO -->
                <div style="
                    margin-bottom:30px;
                ">

                    <img
                        src='https://i.imgur.com/iQPOUXh.jpeg'
                        width='420'
                        style='
                            opacity:0.13;
                            display:block;
                            margin:auto;
                        '
                    />

                </div>

                <!-- TITULO -->
                <div style="
                    margin-top:10px;
                ">

                    <h1 style="
                        color:#38bdf8;
                        font-size:28px;
                        margin:0;
                        font-weight:bold;
                    ">
                        ${titulo}
                    </h1>

                </div>

                <!-- MENSAJE -->
                <div style="
                    margin-top:22px;
                    margin-bottom:30px;
                ">

                    <p style="
                        color:#ffffff;
                        font-size:14px;
                        margin:0;
                        font-weight:500;
                    ">
                        ${mensaje}
                    </p>

                </div>

                ${
                    botonTexto && botonLink
                    ?
                    `
                    <div style="
                        margin-top:25px;
                    ">

                        <a href="${botonLink}"

                            style="
                                background:#38bdf8;
                                color:white;
                                text-decoration:none;
                                padding:14px 28px;
                                border-radius:10px;
                                display:inline-block;
                                font-size:15px;
                                font-weight:bold;
                            "
                        >
                            ${botonTexto}
                        </a>

                    </div>
                    `
                    :
                    ""
                }

                <!-- CARD INFERIOR -->
                <div style="
                    width:95%;
                    margin:auto;
                    margin-top:45px;
                    background:#202c46;
                    border-radius:12px;
                    padding:28px 20px;
                    box-sizing:border-box;
                ">

                    <p style="
                        color:white;
                        font-size:15px;
                        margin:0;
                        margin-bottom:18px;
                        font-weight:bold;
                    ">
                        📅 Fecha: ${new Date().toLocaleString()}
                    </p>

                    <p style="
                        color:white;
                        font-size:15px;
                        margin:0;
                        font-weight:bold;
                    ">
                        📦 Sistema: InvStock La Costa
                    </p>

                </div>

                <!-- FOOTER -->
                <div style="
                    margin-top:28px;
                    color:#cbd5e1;
                    font-size:12px;
                ">

                    Este es un correo automático del sistema

                </div>

            </div>

        </div>

    </body>

    </html>
    `;
};

// =====================================================
// 📧 ENVIAR CORREO
// =====================================================

const enviarCorreo = async (

    destinatario,
    asunto,
    mensaje,
    archivoAdjunto = null

) => {

    try {

        const html = generarTemplate(

            "📊 Reporte de Inventario",

            mensaje
        );

        const mailOptions = {

            from: process.env.EMAIL_USER,

            to: destinatario,

            subject: asunto,

            html,

            attachments:
                archivoAdjunto
                ? [archivoAdjunto]
                : []
        };

        await transporter.sendMail(mailOptions);

        console.log(
            `📧 Correo enviado a ${destinatario}`
        );

    } catch (error) {

        console.log(
            "❌ Error correo:",
            error.message
        );
    }
};

// =====================================================
// 🔐 RECUPERACIÓN PASSWORD
// =====================================================

const enviarCorreoRecuperacion = async (

    destinatario,
    nombre,
    token

) => {

    try {

        const link =
            `${process.env.FRONTEND_URL}/restablecer-password/${token}`;

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

        const mailOptions = {

            from: process.env.EMAIL_USER,

            to: destinatario,

            subject: "🔐 Recuperación de contraseña",

            html
        };

        await transporter.sendMail(mailOptions);

        console.log(
            `📧 Recuperación enviada a ${destinatario}`
        );

    } catch (error) {

        console.log(
            "❌ Error recuperación:",
            error.message
        );
    }
};

// =====================================================
// 🚀 EXPORTS
// =====================================================

module.exports = {

    enviarCorreo,

    enviarCorreoRecuperacion
};