const Movimiento = require("../models/Movimiento");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Notificacion = require("../models/Notificacion");
const crearNotificacion = require("../utils/crearNotificacion");
const { enviarCorreo, enviarCorreoAlertaStock } = require("../utils/email");
const logger = require("../utils/logger");

// =====================================================
// 🔥 CREAR MOVIMIENTO
// =====================================================

const crearMovimiento = async (req, res) => {

    try {

        const { producto, tipo } = req.body;

        const cantidad = Number(req.body.cantidad);

        // =====================================================
        // 🔒 VALIDAR TIPO (NoSQL Injection)
        // =====================================================

        const tiposValidos = ["entrada", "salida"];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({
                error: "El tipo debe ser 'entrada' o 'salida'"
            });
        }

        // =====================================================
        // ✅ VALIDAR PRODUCTO
        // =====================================================

        if (!producto) {
            return res.status(400).json({
                error: "Debe enviar el ID del producto"
            });
        }

        const productoDB = await Producto.findById(producto);
        const usuarioDB  = await Usuario.findById(req.usuario.id);

        if (!productoDB) {
            return res.status(404).json({
                error: "Producto no existe"
            });
        }

        // =====================================================
        // ✅ VALIDAR STOCK
        // =====================================================

        if (tipo === "salida" && productoDB.stock < cantidad) {
            return res.status(400).json({
                error: "Stock insuficiente"
            });
        }

        // =====================================================
        // 🔥 ACTUALIZAR STOCK
        // =====================================================

        if (tipo === "entrada") {
            productoDB.stock += cantidad;
        } else if (tipo === "salida") {
            productoDB.stock -= cantidad;
        }

        await productoDB.save();

        // =====================================================
        // 🚨 STOCK AGOTADO (CRÍTICO)
        // =====================================================

        if (productoDB.stock === 0 && usuarioDB.notificaciones.stockAgotado) {

            const io = req.app.get("io");
            await crearNotificacion(
                "🚨 PRODUCTO SIN STOCK",
                `⚠️ CRÍTICO: ${productoDB.nombre} se ha quedado sin stock.`,
                "stock_agotado",
                producto,
                io,
                true
            );

            // 📧 Fire-and-forget — no bloquea la respuesta HTTP
            enviarCorreo(
                process.env.EMAIL_TO,
                "🚨 Producto sin stock",
                `El producto ${productoDB.nombre} se ha quedado sin stock`
            ).catch(err => logger.error("Error al enviar correo stock agotado", err));
        }

        // =====================================================
        // 🔴 REPOSICIÓN NECESARIA (Stock < 50)
        // =====================================================

        const needsReposicion = productoDB.stock < 50 && productoDB.stock > 0;
        const isCriticalLow   = productoDB.stock <= 20;

        if (needsReposicion && usuarioDB.notificaciones.stockBajo) {

            const io = req.app.get("io");
            const es_critico = isCriticalLow;

            await crearNotificacion(
                es_critico ? "🚨 REPOSICIÓN URGENTE" : "⚠️ Reposición necesaria",
                es_critico
                    ? `⚠️ CRÍTICO: ${productoDB.nombre} stock muy bajo (${productoDB.stock} unidades)`
                    : `Reposición: ${productoDB.nombre} necesita abastecimiento (${productoDB.stock} unidades)`,
                "reposicion_necesaria",
                producto,
                io,
                es_critico
            );

            // 📧 Fire-and-forget — envía a usuarios con preferencias.email activo
            Usuario.find({ "preferencias.email": true }).select("email").then(usuarios => {
                usuarios.forEach(u => {
                    enviarCorreoAlertaStock(u.email, productoDB.nombre, productoDB.stock, productoDB.stockMinimo)
                        .catch(err => logger.error("Error al enviar correo stock bajo", err));
                });
            }).catch(err => logger.error("Error al buscar usuarios para alerta stock bajo", err));
        }

        // =====================================================
        // 🚨 MOVIMIENTOS GRANDES
        // =====================================================

        const tipoTexto = tipo === "entrada" ? "ENTRADA" : "SALIDA";

        const es_abastecimiento_grande = tipo === "entrada" && cantidad >= 200;
        const es_movimiento_critico    = cantidad >= 100 && !(tipo === "entrada" && cantidad >= 200);
        const es_movimiento_grande     = cantidad >= 50 && cantidad < 100;

        if (
            usuarioDB.notificaciones.movimientoGrande &&
            (es_movimiento_grande || es_movimiento_critico || es_abastecimiento_grande)
        ) {

            const io = req.app.get("io");

            if (es_abastecimiento_grande) {

                console.log(`🚀 ABASTECIMIENTO GRANDE DETECTADO (${cantidad} unidades)`);

                await crearNotificacion(
                    "🚀 ABASTECIMIENTO GRANDE",
                    `Entrada de ${cantidad} unidades de ${productoDB.nombre}. Stock nuevo: ${productoDB.stock} unidades`,
                    "abastecimiento_grande",
                    producto,
                    io,
                    true
                );

                // 📧 Fire-and-forget
                enviarCorreo(
                    process.env.EMAIL_TO,
                    "🚀 Abastecimiento grande registrado",
                    `Se registró abastecimiento de ${cantidad} unidades de ${productoDB.nombre}\n\n📦 Stock nuevo: ${productoDB.stock}`
                ).catch(err => logger.error("Error al enviar correo abastecimiento grande", err));

            } else if (es_movimiento_critico) {

                console.log(`🚨 MOVIMIENTO CRÍTICO DETECTADO (${cantidad} unidades)`);

                await crearNotificacion(
                    "🚨 MOVIMIENTO CRÍTICO",
                    `${tipoTexto} importante de ${cantidad} unidades de ${productoDB.nombre}. Stock: ${productoDB.stock}`,
                    "movimiento_critico",
                    producto,
                    io,
                    true
                );

                // 📧 Fire-and-forget
                enviarCorreo(
                    process.env.EMAIL_TO,
                    "🚨 Movimiento crítico detectado",
                    `Se registró ${tipoTexto} crítica de ${cantidad} unidades de ${productoDB.nombre}\n\n📦 Stock actual: ${productoDB.stock}`
                ).catch(err => logger.error("Error al enviar correo movimiento crítico", err));

            } else if (es_movimiento_grande) {

                console.log(`⚠️ MOVIMIENTO GRANDE DETECTADO (${cantidad} unidades)`);

                await crearNotificacion(
                    "⚠️ Movimiento grande",
                    `${tipoTexto} de ${cantidad} unidades de ${productoDB.nombre}. Stock: ${productoDB.stock}`,
                    "movimiento_grande",
                    producto,
                    io,
                    false
                );

                // 📧 Fire-and-forget
                enviarCorreo(
                    process.env.EMAIL_TO,
                    "⚠️ Movimiento grande",
                    `Se registró ${tipoTexto} de ${cantidad} unidades de ${productoDB.nombre}\n\n📦 Stock: ${productoDB.stock}`
                ).catch(err => logger.error("Error al enviar correo movimiento grande", err));
            }
        }

        // =====================================================
        // 🔥 CREAR MOVIMIENTO
        // =====================================================

        const movimiento = new Movimiento({
            producto,
            tipo,
            cantidad,
            usuario: req.usuario.id
        });

        await movimiento.save();

        // =====================================================
        // ✅ RESPUESTA FINAL
        // =====================================================

        res.json({
            ok: true,
            mensaje: "Movimiento registrado correctamente",
            movimiento
        });

    } catch (error) {

        console.log("ERROR REAL:", error);

        res.status(500).json({
            error: error.message
        });
    }
};

// =====================================================
// 🔥 OBTENER MOVIMIENTOS
// =====================================================

const getMovimientos = async (req, res) => {

    try {

        const { producto, desde, hasta } = req.query;

        let filtro = {};

        if (producto) {
            filtro.producto = producto;
        }

        if (desde && hasta) {
            filtro.createdAt = {
                $gte: new Date(desde),
                $lte: new Date(hasta)
            };
        }

        const movimientos = await Movimiento.find(filtro)
            .populate("producto");

        res.json(movimientos);

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener movimientos"
        });
    }
};

// =====================================================
// 📊 RESUMEN MOVIMIENTOS
// =====================================================

const obtenerResumenMovimientos = async (req, res) => {

    try {

        const resumen = await Movimiento.aggregate([
            {
                $group: {
                    _id: "$tipo",
                    total: { $sum: "$cantidad" }
                }
            }
        ]);

        let resultado = { entrada: 0, salida: 0 };

        resumen.forEach(item => {
            if (item._id === "entrada") resultado.entrada = item.total;
            if (item._id === "salida")  resultado.salida  = item.total;
        });

        res.json(resultado);

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener resumen de movimientos"
        });
    }
};

// =====================================================
// 🚀 EXPORTS
// =====================================================

module.exports = {
    crearMovimiento,
    getMovimientos,
    obtenerResumenMovimientos
};
