const Notificacion =
require("../models/Notificacion");

const crearNotificacion = async (

    titulo,
    mensaje,
    tipo = "info",
    producto = null,
    io = null,
    sonarAlarma = false

) => {

    try {

        const notificacion =
            await Notificacion.create({

            titulo,
            mensaje,
            tipo,
            producto
        });

        // 🔥 EMITIR NOTIFICACIÓN LIVE CON SONIDO
        if (io) {
            io.emit("nueva_notificacion", {
                _id: notificacion._id,
                titulo,
                mensaje,
                tipo,
                producto,
                createdAt: notificacion.createdAt,
                leida: false,
                sonarAlarma: sonarAlarma,
                prioridad: sonarAlarma ? "alta" : "normal"
            });
        }

    } catch (error) {

        console.log(

            "Error creando notificación:",

            error
        );
    }
};

module.exports =
crearNotificacion;