const cron = require("node-cron");

const Producto = require("../models/Producto");

const { enviarCorreo } = require("../utils/email");

const crearNotificacion =
require("../utils/crearNotificacion");

// =====================================================
// 🚨 ALERTAS STOCK AGOTADO
// TEMPORAL → CADA 1 MINUTO
// =====================================================

cron.schedule("0 */6 * * *", async () => {

    try {

        console.log(
            "🚨 Verificando productos agotados..."
        );

        const productosAgotados =
            await Producto.find({
                stock: 0
            });

        for (const producto of productosAgotados) {

            // =====================================================
            // 📧 CORREO
            // =====================================================

            await enviarCorreo(

                process.env.EMAIL_TO,

                "🚨 Producto agotado",

                `El producto ${producto.nombre} sigue agotado.

Stock actual: 0 unidades

⚠️ Han pasado más de 6 horas sin reposición.`
            );

            // =====================================================
            // 🔔 NOTIFICACIÓN SISTEMA
            // =====================================================

            await crearNotificacion(

                "Producto agotado",

                `${producto.nombre} sigue agotado después de varias horas sin reposición.`,

                "danger"
            );
        }

    } catch (error) {

        console.log(
            "Error alerta stock agotado:",
            error
        );
    }

});

// =====================================================
// ⚠️ ALERTAS STOCK BAJO
// TEMPORAL → CADA 2 MINUTOS
// =====================================================

cron.schedule("0 */12 * * *", async () => {

    try {

        console.log(
            "⚠️ Verificando productos con stock bajo..."
        );

        const productosStockBajo =
            await Producto.find({

                $expr: {
                    $and: [

                        {
                            $lte: [
                                "$stock",
                                "$stockMinimo"
                            ]
                        },

                        {
                            $gt: [
                                "$stock",
                                0
                            ]
                        }
                    ]
                }
            });

        for (const producto of productosStockBajo) {

            // =====================================================
            // 📧 CORREO
            // =====================================================

            await enviarCorreo(

                process.env.EMAIL_TO,

                "⚠️ Recordatorio stock bajo",

                `El producto ${producto.nombre} sigue con stock bajo.

Stock actual: ${producto.stock}
Stock mínimo: ${producto.stockMinimo}

⚠️ Han pasado más de 12 horas sin reposición.`
            );

            // =====================================================
            // 🔔 NOTIFICACIÓN SISTEMA
            // =====================================================

            await crearNotificacion(

                "Stock bajo detectado",

                `${producto.nombre} continúa con stock bajo (${producto.stock} unidades).`,

                "warning"
            );
        }

    } catch (error) {

        console.log(
            "Error alerta stock bajo:",
            error
        );
    }

});

console.log(
    "✅ Jobs automáticos de stock iniciados"
);