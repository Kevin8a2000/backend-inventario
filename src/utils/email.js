const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarCorreo = async (asunto, mensaje) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // por ahora a ti mismo
            subject: asunto,
            text: mensaje
        });

        console.log("Correo enviado");
    } catch (error) {
        console.log("Error enviando correo", error);
    }
};

module.exports = enviarCorreo;