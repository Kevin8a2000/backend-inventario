const cron = require("node-cron");

const Producto =
require("../models/Producto");

const crearNotificacion =
require("../utils/crearNotificacion");

const enviarCorreo =
require("../utils/email");

// =====================================================
// 🚨 REVISAR VENCIMIENTOS
// =====================================================

const revisarVencimientos = (io = null) => {

    // 🔥 CADA 12 HORAS
    cron.schedule("0 */12 * * *", async () => {

        try {

            console.log(
                "⏰ Revisando vencimientos..."
            );

            const productos =
                await Producto.find({

                    usaLotes: true,

                    fechaVencimiento: {
                        $ne: null
                    }
                });

            const hoy = new Date();

            for (const producto of productos) {

                const fechaVencimiento =
                    new Date(
                        producto.fechaVencimiento
                    );

                // 🔥 DIFERENCIA EN DÍAS
                const diferenciaDias =
                    Math.ceil(

                        (
                            fechaVencimiento - hoy
                        )

                        /

                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );

                // =====================================================
                // ⚠️ ALERTAS PREVENTIVAS (UMBRALES REALISTAS)
                // =====================================================

                // Umbrales realistas:
                // 30+ días: Informativo
                // 15-29 días: Aviso normal
                // 7-14 días: CRÍTICO (SONIDO)
                // 3-6 días: MUY CRÍTICO (SONIDO FUERTE)
                // <=0 días: VENCIDO (SONIDO CRÍTICO)

                if (diferenciaDias === 30) {
                    // 30 días - INFORMATIVO
                    await crearNotificacion(
                        "ℹ️ Información: Próximo a vencer",
                        `${producto.nombre} vence en ${diferenciaDias} días. Planificar ventas.`,
                        "vencimiento_proximo",
                        producto._id,
                        io,
                        false
                    );
                } else if (diferenciaDias === 15) {
                    // 15 días - AVISO
                    await crearNotificacion(
                        "⚠️ Alerta de vencimiento",
                        `${producto.nombre} vence en ${diferenciaDias} días. Aumentar ventas.`,
                        "vencimiento_proximo",
                        producto._id,
                        io,
                        false
                    );
                } else if (diferenciaDias === 7) {
                    // 7 días - CRÍTICO (SONIDO)
                    await crearNotificacion(
                        "🚨 ALERTA CRÍTICA DE VENCIMIENTO",
                        `⚠️ CRÍTICO: ${producto.nombre} vence en ${diferenciaDias} DÍAS. ACCIÓN INMEDIATA.`,
                        "vencimiento_critico",
                        producto._id,
                        io,
                        true
                    );
                } else if (diferenciaDias <= 3 && diferenciaDias > 0) {
                    // 3 días o menos - CRÍTICO MÁXIMO (SONIDO FUERTE)
                    await crearNotificacion(
                        "🚀 VENCIMIENTO INMINENTE",
                        `⚠️⚠️ CRÍTICO: ${producto.nombre} vence en ${diferenciaDias} DÍAS. LIQUIDACIÓN URGENTE.`,
                        "vencimiento_inminente",
                        producto._id,
                        io,
                        true
                    );

                    await enviarCorreo(

                        process.env.EMAIL_TO,

                        "⚠️ Producto próximo a vencer",

                        `
━━━━━━━━━━━━━━━━━━

⚠️ ALERTA DE VENCIMIENTO

📦 Producto:
${producto.nombre}

🏷 Marca:
${producto.marca || "Sin marca"}

🧾 Lote:
${producto.lote || "Sin lote"}

📅 Fecha vencimiento:
${producto.fechaVencimiento}

⏳ Faltan:
${diferenciaDias} días

━━━━━━━━━━━━━━━━━━
`
                    );

                    console.log(
                        `⚠️ Alerta enviada: ${producto.nombre}`
                    );
                }

                // =====================================================
                // 🚨 PRODUCTO VENCIDO - CRÍTICO
                // =====================================================

                if (diferenciaDias <= 0) {

                    // 🚨 NOTIFICACIÓN CRÍTICA + SONIDO
                    await crearNotificacion(
                        "🚨 PRODUCTO VENCIDO",
                        `⚠️⚠️ CRÍTICO: ${producto.nombre} YA HA VENCIDO. ELIMINAR DEL INVENTARIO INMEDIATAMENTE.`,
                        "producto_vencido",
                        producto._id,
                        io,
                        true  // ← SONAR ALARMA CRÍTICA
                    );

                    await enviarCorreo(

                        process.env.EMAIL_TO,

                        "🚨 Producto vencido",

                        `
━━━━━━━━━━━━━━━━━━

🚨 PRODUCTO VENCIDO

📦 Producto:
${producto.nombre}

🏷 Marca:
${producto.marca || "Sin marca"}

🧾 Lote:
${producto.lote || "Sin lote"}

📅 Fecha vencimiento:
${producto.fechaVencimiento}

🚨 Estado:
PRODUCTO VENCIDO

━━━━━━━━━━━━━━━━━━
`
                    );

                    console.log(
                        `🚨 Producto vencido: ${producto.nombre}`
                    );
                }
            }

        } catch (error) {

            console.log(error);
        }
    });

};

module.exports =
revisarVencimientos;