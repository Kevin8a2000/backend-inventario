const Producto =
require("../models/Producto");

const Movimiento =
require("../models/Movimiento");

const Sugerencia =
require("../models/Sugerencia");

// =====================================================
// 💾 SUGERENCIAS PERSISTENTES
// =====================================================

async function generarSugerenciasAutomaticas(usuarioId) {

    const nuevas = [];

    // 1. Productos con stock crítico (bajo el mínimo)
    const criticos = await Producto.find({
        $expr: { $lte: ["$stock", "$stockMinimo"] }
    });

    for (const p of criticos) {
        const yaExiste = await Sugerencia.findOne({
            usuario: usuarioId,
            titulo: { $regex: p.nombre, $options: "i" },
            tipo: "alerta",
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (!yaExiste) {
            nuevas.push({
                usuario: usuarioId,
                tipo: "alerta",
                icono: "⚠️",
                titulo: `Stock Crítico: ${p.nombre}`,
                descripcion: `Solo quedan ${p.stock} unidades. El mínimo configurado es ${p.stockMinimo}.`
            });
        }
    }

    // 2. Productos sin movimientos en los últimos 30 días
    const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const productosConMovimiento = await Movimiento.distinct("producto", {
        createdAt: { $gte: hace30dias }
    });
    const sinMovimiento = await Producto.find({
        _id: { $nin: productosConMovimiento },
        stock: { $gt: 0 }
    }).limit(3);

    for (const p of sinMovimiento) {
        nuevas.push({
            usuario: usuarioId,
            tipo: "sugerencia",
            icono: "📦",
            titulo: `Stock estancado: ${p.nombre}`,
            descripcion: `Este producto lleva más de 30 días sin movimientos y tiene ${p.stock} unidades en stock.`
        });
    }

    // 3. Recordatorio de reporte si es lunes
    if (new Date().getDay() === 1) {
        nuevas.push({
            usuario: usuarioId,
            tipo: "recordatorio",
            icono: "📅",
            titulo: "Reporte semanal disponible",
            descripcion: "Revisa el resumen de movimientos de la semana en la sección de Reportes."
        });
    }

    if (nuevas.length > 0) {
        await Sugerencia.insertMany(nuevas);
    }
}

const getSugerencias = async (req, res) => {
    try {
        await generarSugerenciasAutomaticas(req.usuario.id);

        const sugerencias = await Sugerencia.find({ usuario: req.usuario.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(sugerencias);

    } catch (err) {
        console.error("ai/suggestions error:", err);
        res.status(500).json({ error: "Error al obtener sugerencias" });
    }
};

const marcarLeida = async (req, res) => {
    try {
        await Sugerencia.findOneAndUpdate(
            { _id: req.params.id, usuario: req.usuario.id },
            { leida: true }
        );
        res.json({ ok: true });

    } catch (err) {
        res.status(500).json({ error: "Error al marcar sugerencia" });
    }
};

const marcarTodasLeidas = async (req, res) => {
    try {
        await Sugerencia.updateMany(
            { usuario: req.usuario.id },
            { leida: true }
        );
        res.json({ ok: true });

    } catch (err) {
        res.status(500).json({ error: "Error al marcar todas como leídas" });
    }
};

exports.getSugerencias = getSugerencias;
exports.marcarLeida = marcarLeida;
exports.marcarTodasLeidas = marcarTodasLeidas;

// =====================================================
// 🤖 IA INVENTARIO PROFESIONAL
// =====================================================

exports.obtenerRecomendacionesIA =
async (req, res) => {

    try {

        const recomendaciones = [];

        // =====================================================
        // 📦 PRODUCTOS
        // =====================================================

        const productos =
            await Producto.find()
            .populate("categoria");

        // =====================================================
        // 📅 ÚLTIMOS 30 DÍAS
        // =====================================================

        const hace30Dias = new Date();

        hace30Dias.setDate(
            hace30Dias.getDate() - 30
        );

        // =====================================================
        // 🔄 MOVIMIENTOS
        // =====================================================

        const movimientos =
            await Movimiento.find({

                createdAt: {
                    $gte: hace30Dias
                }
            });

        // =====================================================
        // 📥 ENTRADAS / 📤 SALIDAS
        // =====================================================

        const entradas =
            movimientos.filter(
                m => m.tipo === "entrada"
            );

        const salidas =
            movimientos.filter(
                m => m.tipo === "salida"
            );

        // =====================================================
        // 📊 ESTADO GENERAL INVENTARIO
        // =====================================================

        if (salidas.length > entradas.length) {

            recomendaciones.push({

                tipo: "success",

                prioridad: "alta",

                titulo: "Inventario saludable",

                mensaje:
                    "Las ventas actuales superan el ingreso de productos, indicando un flujo comercial positivo.",

                icono: "📈"
            });
        }

        if (entradas.length > salidas.length * 1.5) {

            recomendaciones.push({

                tipo: "warning",

                prioridad: "alta",

                titulo: "Acumulación de inventario",

                mensaje:
                    "El inventario está creciendo más rápido que las ventas. Se recomienda revisar estrategias comerciales.",

                icono: "📦"
            });
        }

        // =====================================================
        // ⚠️ STOCK CRÍTICO
        // =====================================================

        const stockCritico =
            productos.filter(
                p => p.stock <= 5
            );

        if (stockCritico.length > 0) {

            const nombres =
                stockCritico
                    .slice(0, 5)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "danger",

                prioridad: "critica",

                titulo: "Stock crítico",

                mensaje:
                    `Productos con stock bajo: ${nombres}.`,

                icono: "⚠️"
            });
        }

        // =====================================================
        // 📈 ANALIZAR VENTAS
        // =====================================================

        const ventasPorProducto = {};

        salidas.forEach(m => {

            const id =
                m.producto?.toString();

            if (!id) return;

            ventasPorProducto[id] =
                (ventasPorProducto[id] || 0) + 1;
        });

        // =====================================================
        // 🏆 PRODUCTO ESTRELLA
        // =====================================================

        let topID = null;
        let topVentas = 0;

        for (const id in ventasPorProducto) {

            if (
                ventasPorProducto[id] >
                topVentas
            ) {

                topVentas =
                    ventasPorProducto[id];

                topID = id;
            }
        }

        if (topID) {

            const productoTop =
                await Producto.findById(topID);

            if (productoTop) {

                recomendaciones.push({

                    tipo: "success",

                    prioridad: "alta",

                    titulo: "Producto estrella",

                    mensaje:
                        `${productoTop.nombre} lidera las ventas del último mes.`,

                    icono: "🏆"
                });

                // =====================================================
                // 🤖 IA PREDICCIÓN
                // =====================================================

                if (productoTop.stock <= 10) {

                    recomendaciones.push({

                        tipo: "warning",

                        prioridad: "alta",

                        titulo: "Predicción IA",

                        mensaje:
                            `${productoTop.nombre} podría agotarse pronto si mantiene esta tendencia de ventas.`,

                        icono: "🤖"
                    });
                }

                // =====================================================
                // 🚨 REPOSICIÓN URGENTE
                // =====================================================

                if (productoTop.stock <= 5) {

                    recomendaciones.push({

                        tipo: "danger",

                        prioridad: "critica",

                        titulo: "Reposición urgente",

                        mensaje:
                            `Se recomienda reabastecer ${productoTop.nombre} inmediatamente.`,

                        icono: "🚨"
                    });
                }
            }
        }

        // =====================================================
        // 📉 PRODUCTOS LENTOS
        // =====================================================

        const productosLentos =
            productos.filter(p => {

                const ventas =
                    ventasPorProducto[p._id] || 0;

                return (
                    ventas <= 1 &&
                    p.stock >= 15
                );
            });

        if (productosLentos.length > 0) {

            const nombres =
                productosLentos
                    .slice(0, 4)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "info",

                prioridad: "media",

                titulo: "Baja rotación",

                mensaje:
                    `${nombres} presentan pocas ventas actualmente.`,

                icono: "📉"
            });

            recomendaciones.push({

                tipo: "warning",

                prioridad: "media",

                titulo: "Prevención de pérdidas",

                mensaje:
                    "Se recomienda crear promociones o descuentos para aumentar la salida de productos lentos.",

                icono: "💡"
            });
        }

        // =====================================================
        // 💀 PRODUCTOS SIN MOVIMIENTO
        // =====================================================

        const productosMuertos =
            productos.filter(p => {

                const ventas =
                    ventasPorProducto[p._id] || 0;

                return (
                    ventas === 0 &&
                    p.stock >= 20
                );
            });

        if (productosMuertos.length > 0) {

            const nombres =
                productosMuertos
                    .slice(0, 3)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "danger",

                prioridad: "alta",

                titulo: "Inventario detenido",

                mensaje:
                    `${nombres} no registran ventas recientes y ocupan espacio innecesario.`,

                icono: "🧊"
            });
        }

        // =====================================================
        // 💰 PRODUCTO PREMIUM
        // =====================================================

        const premium =
            [...productos]
                .sort(
                    (a, b) =>
                        b.precio - a.precio
                )[0];

        if (premium) {

            recomendaciones.push({

                tipo: "info",

                prioridad: "baja",

                titulo: "Producto premium",

                mensaje:
                    `${premium.nombre} es uno de los productos más costosos del inventario.`,

                icono: "💰"
            });
        }

        // =====================================================
        // 💵 RENTABILIDAD
        // =====================================================

        const rentables =
            productos.filter(
                p => p.precio >= 100
            );

        if (rentables.length > 0) {

            const nombres =
                rentables
                    .slice(0, 4)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "success",

                prioridad: "alta",

                titulo: "Productos rentables",

                mensaje:
                    `${nombres} muestran buena rentabilidad actualmente.`,

                icono: "💵"
            });
        }

        // =====================================================
        // 🏆 CATEGORÍA DOMINANTE
        // =====================================================

        const categorias = {};

        productos.forEach(p => {

            const nombre =
                p.categoria?.nombre;

            if (!nombre) return;

            categorias[nombre] =
                (categorias[nombre] || 0) + 1;
        });

        let categoriaTop = "";
        let total = 0;

        for (const cat in categorias) {

            if (categorias[cat] > total) {

                total =
                    categorias[cat];

                categoriaTop = cat;
            }
        }

        if (categoriaTop) {

            recomendaciones.push({

                tipo: "success",

                prioridad: "media",

                titulo: "Categoría dominante",

                mensaje:
                    `${categoriaTop} domina gran parte del inventario actual.`,

                icono: "🏆"
            });
        }

        // =====================================================
        // 📅 VENCIMIENTOS
        // =====================================================

        const hoy = new Date();

        const vencidos = [];
        const proximos = [];

        productos.forEach(p => {

            if (!p.fechaVencimiento)
                return;

            const fecha =
                new Date(
                    p.fechaVencimiento
                );

            const dias =
                Math.ceil(
                    (fecha - hoy) /
                    (1000 * 60 * 60 * 24)
                );

            if (dias < 0) {

                vencidos.push(p);
            }

            if (
                dias >= 0 &&
                dias <= 30
            ) {

                proximos.push(p);
            }
        });

        // =====================================================
        // 🚫 PRODUCTOS VENCIDOS
        // =====================================================

        if (vencidos.length > 0) {

            const nombres =
                vencidos
                    .slice(0, 4)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "danger",

                prioridad: "critica",

                titulo: "Productos vencidos",

                mensaje:
                    `${nombres} tienen lotes vencidos actualmente.`,

                icono: "🚫"
            });

            recomendaciones.push({

                tipo: "warning",

                prioridad: "alta",

                titulo: "Riesgo económico",

                mensaje:
                    "Se recomienda retirar o revisar productos vencidos para evitar pérdidas económicas.",

                icono: "💸"
            });
        }

        // =====================================================
        // ⏰ PRÓXIMOS A VENCER
        // =====================================================

        if (proximos.length > 0) {

            const nombres =
                proximos
                    .slice(0, 4)
                    .map(p => p.nombre)
                    .join(", ");

            recomendaciones.push({

                tipo: "warning",

                prioridad: "alta",

                titulo: "Próximos a vencer",

                mensaje:
                    `${nombres} podrían vencer en menos de 30 días.`,

                icono: "⏰"
            });

            recomendaciones.push({

                tipo: "info",

                prioridad: "media",

                titulo: "Prevención IA",

                mensaje:
                    "Se recomienda aplicar promociones o aumentar rotación en productos próximos a vencer.",

                icono: "💡"
            });
        }

        // =====================================================
        // 📦 CONTROL DE LOTES
        // =====================================================

        const productosLotes =
            productos.filter(
                p => p.usaLotes
            );

        if (productosLotes.length > 0) {

            recomendaciones.push({

                tipo: "info",

                prioridad: "baja",

                titulo: "Control de lotes",

                mensaje:
                    `${productosLotes.length} productos utilizan control de lotes y vencimiento.`,

                icono: "📅"
            });
        }

        // =====================================================
        // 🤖 CONSEJO FINAL
        // =====================================================

        recomendaciones.push({

            tipo: "success",

            prioridad: "baja",

            titulo: "Asistente IA",

            mensaje:
                "Se recomienda revisar diariamente productos críticos, vencimientos y productos de alta demanda.",

            icono: "🤖"
        });

        // =====================================================
        // 📊 ORDENAR PRIORIDAD
        // =====================================================

        const prioridadOrden = {

            critica: 1,
            alta: 2,
            media: 3,
            baja: 4
        };

        recomendaciones.sort(

            (a, b) =>

                prioridadOrden[a.prioridad] -
                prioridadOrden[b.prioridad]
        );

        // =====================================================
        // ✅ RESPUESTA FINAL
        // =====================================================

        res.json(recomendaciones);

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error:
                "Error generando recomendaciones IA"
        });
    }
};