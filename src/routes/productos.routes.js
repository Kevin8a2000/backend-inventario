﻿const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");

const {
    obtenerProductos,
    crearProducto,
    obtenerStockBajo,
    obtenerValorInventario,
    actualizarProducto,
    eliminarProducto
} = require("../controllers/productos.controller");

const {
    validarProducto,
    validarActualizacionProducto
} = require("../middlewares/validarInputs");

const verificarToken = require("../middlewares/auth");
const verificarPermiso = require("../middlewares/verificarPermiso");
const validarObjectId = require("../middlewares/validarObjectId");
const crearNotificacion = require("../utils/crearNotificacion");
const { enviarCorreo } = require("../utils/email");
const { escaparHTML } = require("../utils/sanitizar");

const sanitizarTexto = (texto) => {
    if (typeof texto !== 'string') return '';
    return escaparHTML(texto.trim());
};

// =====================================================
// ✅ GET TODOS LOS PRODUCTOS
// =====================================================
router.get(
    "/",
    verificarToken,
    obtenerProductos
);

// =====================================================
// ✅ TOTAL PRODUCTOS
// =====================================================
router.get(
    "/total",
    verificarToken,
    verificarPermiso("ver_reportes"),
    async (req, res) => {
        try {
            const total = await Producto.countDocuments();
            res.json({ total });
        } catch (error) {
            console.error("Error al contar productos:", error);
            res.status(500).json({ error: "Error al contar productos" });
        }
    }
);

// =====================================================
// 📉 STOCK BAJO
// =====================================================
router.get(
    "/stock-bajo",
    verificarToken,
    verificarPermiso("ver_reportes"),
    obtenerStockBajo
);

// =====================================================
// 💰 VALOR INVENTARIO
// =====================================================
router.get(
    "/valor-inventario",
    verificarToken,
    verificarPermiso("ver_reportes"),
    obtenerValorInventario
);

// =====================================================
// 📦 LOTES
// =====================================================
router.get(
    "/lotes",
    verificarToken,
    verificarPermiso("crear_lote"),
    async (req, res) => {
        try {
            const { search, estado } = req.query;
            const hoy = new Date();
            const productos = await Producto.find({
                "lotes.0": { $exists: true }
            }).populate("categoria");

            let lotes = [];
            productos.forEach(p => {
                p.lotes.forEach(l => {
                    lotes.push({
                        id:               l._id,
                        productoId:       p._id,
                        producto:         p.nombre,
                        marca:            p.marca,
                        categoria:        p.categoria?.nombre,
                        lote:             l,
                        sku:              p.sku,
                        fechaVencimiento: l.fechaVencimiento,
                        stock:            l.stock
                    });
                });
            });

            if (search && typeof search === 'string') {
                const texto = sanitizarTexto(search).toLowerCase();
                if (texto) {
                    lotes = lotes.filter(l =>
                        [l.producto, l.marca, l.lote?.codigo, l.sku]
                            .some(v => typeof v === 'string' && v.toLowerCase().includes(texto))
                    );
                }
            }

            if (estado && typeof estado === 'string') {
                lotes = lotes.filter(l => {
                    const fecha = l.fechaVencimiento ? new Date(l.fechaVencimiento) : null;
                    if (estado === "vencido") return fecha && fecha < hoy;
                    if (estado === "agotado") return l.stock <= 0;
                    if (estado === "activo") return l.stock > 0 && (!fecha || fecha >= hoy);
                    return true;
                });
            }

            res.json({ ok: true, data: lotes, total: lotes.length });
        } catch (error) {
            console.error("Error al obtener lotes:", error);
            res.status(500).json({ error: "Error al obtener lotes" });
        }
    }
);

// =====================================================
// 📦 RESUMEN LOTES
// =====================================================
router.get(
    "/lotes/resumen",
    verificarToken,
    verificarPermiso("crear_lote"),
    async (req, res) => {
        try {
            const productos = await Producto.find({ usaLotes: true });
            const hoy = new Date();
            // Unificar ambos formatos
            const todosLotes = productos.flatMap(p =>
                p.lotes && p.lotes.length > 0
                    ? p.lotes
                    : [{ stock: p.stock, fechaVencimiento: p.fechaVencimiento }]
            );
            const totalLotes = todosLotes.length;
            const activos = todosLotes.filter(l => l.stock > 0).length;
            const agotados = todosLotes.filter(l => l.stock <= 0).length;
            const proximosVencer = todosLotes.filter(l => {
                if (!l.fechaVencimiento) return false;
                const dias = Math.ceil((new Date(l.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24));
                return dias <= 30 && dias >= 0;
            }).length;

            res.json({ totalLotes, activos, agotados, proximosVencer });
        } catch (error) {
            console.error("Error al obtener resumen de lotes:", error);
            res.status(500).json({ error: "Error al obtener resumen de lotes" });
        }
    }
);

// =====================================================
// ➕ CREAR LOTE
// =====================================================
router.post(
    "/lotes",
    verificarToken,
    verificarPermiso("crear_lote"),
    async (req, res) => {
        try {
            const { productoId, lote, sku, stock, fechaVencimiento, observacionLote } = req.body;

            if (!productoId) {
                return res.status(400).json({ error: "productoId es requerido" });
            }

            const producto = await Producto.findById(productoId);
            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            producto.lotes.push({
                codigo:           sanitizarTexto(lote || 'S/N'),
                stock:            Number(stock) || 0,
                fechaEntrada:     new Date(),
                fechaVencimiento: fechaVencimiento || null,
                observacion:      sanitizarTexto(observacionLote || '')
            });

            producto.usaLotes = true;
            producto.stock = producto.lotes.reduce((sum, l) => sum + l.stock, 0);
            await producto.save();

            await crearNotificacion(
                "Nuevo lote creado",
                `Se creó el lote ${lote || "S/N"} para el producto ${producto.nombre}.`,
                "success"
            );

            const nuevoLote = producto.lotes[producto.lotes.length - 1];
            res.status(201).json({ ok: true, mensaje: "Lote creado correctamente", lote: nuevoLote });

        } catch (error) {
            console.error("Error al crear lote:", error);
            res.status(500).json({ error: "Error al crear el lote" });
        }
    }
);

// =====================================================
// 📊 STOCK POR CATEGORÍA
// =====================================================
router.get(
    "/stock-por-categoria",
    verificarToken,
    verificarPermiso("ver_reportes"),
    async (req, res) => {
        try {
            const { categoria, estado } = req.query;
            const filtro = {};

            if (categoria && typeof categoria === 'string' && categoria !== "Todas") {
                const categoriaSanitizada = sanitizarTexto(categoria);
                const categoriaDB = await Categoria.findOne({ nombre: categoriaSanitizada });
                if (categoriaDB) filtro.categoria = categoriaDB._id;
            }

            if (estado === "critico") {
                filtro.stock = { $lte: 5 };
            } else if (estado === "bajo") {
                filtro.stock = { $gt: 5, $lte: 15 };
            } else if (estado === "normal") {
                filtro.stock = { $gt: 15 };
            }

            const productos = await Producto.find(filtro).populate("categoria");
            const agrupado = productos.reduce((acc, producto) => {
                const categoriaNombre = producto.categoria?.nombre || "Sin categoría";
                acc[categoriaNombre] = (acc[categoriaNombre] || 0) + producto.stock;
                return acc;
            }, {});

            const resultado = Object.keys(agrupado).map(cat => ({ _id: cat, totalStock: agrupado[cat] }));
            res.json({ ok: true, data: resultado, total: resultado.length });
        } catch (error) {
            console.error("Error al obtener stock por categoría:", error);
            res.status(500).json({ error: "Error al obtener stock por categoría" });
        }
    }
);

// =====================================================
// 🔒 POST - Crear producto (protegido)
// =====================================================
router.post(
    "/",
    verificarToken,
    verificarPermiso("crear_producto"),
    validarProducto,
    crearProducto
);

// =====================================================
// ✏️ ACTUALIZAR PRODUCTO (protegido)
// =====================================================
router.put(
    "/:id",
    verificarToken,
    validarObjectId,
    verificarPermiso("editar_producto"),
    validarActualizacionProducto,
    actualizarProducto
);

// =====================================================
// ❌ ELIMINAR PRODUCTO (protegido)
// =====================================================
router.delete(
    "/:id",
    verificarToken,
    validarObjectId,
    verificarPermiso("eliminar_producto"),
    eliminarProducto
);

// =====================================================
// 🔁 REPONER STOCK (protegido)
// =====================================================
router.post(
    "/:id/reponer",
    verificarToken,
    validarObjectId,
    verificarPermiso("crear_lote"),
    async (req, res) => {
        try {
            const { cantidad } = req.body;
            const producto = await Producto.findById(req.params.id);
            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            if (!cantidad || Number(cantidad) <= 0) {
                return res.status(400).json({ error: "Cantidad inválida" });
            }

            const stockAnterior = producto.stock;
            producto.stock += Number(cantidad);
            await producto.save();

            await crearNotificacion(
                "Stock repuesto",
                `Se repuso stock del producto ${producto.nombre}.`,
                "success"
            );

            const limiteMovimiento = Number(producto.movimientoMaximo) || 50;
            if (Number(cantidad) >= limiteMovimiento) {
                // 📧 Fire-and-forget — no bloquea la respuesta HTTP
                enviarCorreo(
                    process.env.EMAIL_TO,
                    "🔥 Reposición grande detectada",
                    `Producto: ${producto.nombre}\n\nStock anterior: ${stockAnterior}\nCantidad agregada: ${cantidad}\n\nNuevo stock: ${producto.stock}`
                ).catch(err => console.error("Error al enviar correo reposición:", err.message));
            }

            res.json({ mensaje: "Stock repuesto correctamente", producto });
        } catch (error) {
            console.error("Error al reponer stock:", error);
            res.status(500).json({ error: "Error al reponer stock" });
        }
    }
);

// =====================================================
// ❌ ELIMINAR LOTE (protegido)
// =====================================================
router.delete(
    "/lotes/:id",
    verificarToken,
    validarObjectId,
    verificarPermiso("eliminar_producto"),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Formato nuevo: subdocumento en lotes[]
            let producto = await Producto.findOne({ "lotes._id": id });
            if (producto) {
                const loteEntry = producto.lotes.id(id);
                if (!loteEntry) {
                    return res.status(404).json({ ok: false, error: "Lote no encontrado" });
                }
                const codigoLote    = loteEntry.codigo || 'S/N';
                const nombreProducto = producto.nombre;

                // deleteOne() elimina el subdocumento del array en memoria (Mongoose 9)
                loteEntry.deleteOne();
                // Recalcular stock con los lotes restantes (ya sin el eliminado)
                producto.stock = producto.lotes.reduce((sum, l) => sum + l.stock, 0);
                await producto.save();

                await crearNotificacion(
                    "Lote eliminado",
                    `El lote ${codigoLote} del producto ${nombreProducto} fue eliminado.`,
                    "warning"
                );

                return res.json({ ok: true, mensaje: "Lote eliminado correctamente" });
            }

            // Formato legacy: el id es el _id del producto, lote embebido en producto.lote
            producto = await Producto.findById(id);
            if (producto && producto.usaLotes && producto.lotes.length === 0) {
                const codigoLote = producto.lote?.codigo || 'S/N';
                const nombreProducto = producto.nombre;

                await Producto.findByIdAndUpdate(id, {
                    $unset: { lote: "" },
                    $set: { stock: 0, usaLotes: false }
                });

                await crearNotificacion(
                    "Lote eliminado",
                    `El lote ${codigoLote} del producto ${nombreProducto} fue eliminado.`,
                    "warning"
                );

                return res.json({ ok: true, mensaje: "Lote eliminado correctamente" });
            }

            return res.status(404).json({ ok: false, error: "Lote no encontrado" });
        } catch (error) {
            console.error("Error al eliminar lote:", error);
            res.status(500).json({ ok: false, error: "Error al eliminar lote" });
        }
    }
);

// =====================================================
// ✏️ EDITAR LOTES (protegido)
// =====================================================
router.put(
    "/lotes/:id",
    verificarToken,
    validarObjectId,
    verificarPermiso("crear_lote"),
    async (req, res) => {
        try {
            const { lote, stock, fechaVencimiento, observacionLote } = req.body;
            const { id } = req.params;

            // Formato nuevo: subdocumento en lotes[]
            let producto = await Producto.findOne({ "lotes._id": id });
            if (producto) {
                const loteEntry = producto.lotes.id(id);
                const stockAnterior = producto.stock;

                if (lote !== undefined)            loteEntry.codigo           = sanitizarTexto(String(lote));
                if (stock !== undefined)            loteEntry.stock            = Number(stock);
                if (fechaVencimiento !== undefined) loteEntry.fechaVencimiento = fechaVencimiento || null;
                if (observacionLote !== undefined)  loteEntry.observacion      = sanitizarTexto(observacionLote);

                producto.stock = producto.lotes.reduce((sum, l) => sum + l.stock, 0);
                await producto.save();

                await crearNotificacion(
                    "Lote actualizado",
                    `El lote ${loteEntry.codigo} del producto ${producto.nombre} fue actualizado.`,
                    "info"
                );

                enviarCorreo(
                    process.env.EMAIL_TO,
                    "✏️ Lote actualizado",
                    `Producto: ${producto.nombre} | Lote: ${loteEntry.codigo} | SKU: ${producto.sku} | Stock anterior: ${stockAnterior} | Nuevo stock: ${producto.stock}`
                ).catch(err => console.error("Error al enviar correo lote:", err.message));

                return res.json({ mensaje: "Lote actualizado correctamente", producto });
            }

            // Formato legacy: el id es el _id del producto, lote embebido en producto.lote
            producto = await Producto.findById(id);
            if (producto && producto.usaLotes && producto.lotes.length === 0) {
                const stockAnterior = producto.stock;

                if (lote !== undefined)            producto.lote.codigo           = sanitizarTexto(String(lote));
                if (fechaVencimiento !== undefined) producto.lote.fechaVencimiento = fechaVencimiento || null;
                if (observacionLote !== undefined)  producto.lote.observacion      = sanitizarTexto(observacionLote);
                if (stock !== undefined)            producto.stock                 = Number(stock);

                await producto.save();

                await crearNotificacion(
                    "Lote actualizado",
                    `El lote ${producto.lote.codigo} del producto ${producto.nombre} fue actualizado.`,
                    "info"
                );

                enviarCorreo(
                    process.env.EMAIL_TO,
                    "✏️ Lote actualizado",
                    `Producto: ${producto.nombre} | Lote: ${producto.lote.codigo} | SKU: ${producto.sku} | Stock anterior: ${stockAnterior} | Nuevo stock: ${producto.stock}`
                ).catch(err => console.error("Error al enviar correo lote:", err.message));

                return res.json({ mensaje: "Lote actualizado correctamente", producto });
            }

            return res.status(404).json({ error: "Lote no encontrado" });
        } catch (error) {
            console.error("Error al actualizar lote:", error);
            res.status(500).json({ error: "Error al actualizar lote" });
        }
    }
);

// =====================================================
// ✅ GET PRODUCTO POR ID
// =====================================================
router.get(
    "/:id",
    verificarToken,
    validarObjectId,
    verificarPermiso("ver_productos"),
    async (req, res) => {
        try {
            const producto = await Producto.findById(req.params.id);
            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.json(producto);
        } catch (error) {
            console.error("Error al obtener producto:", error);
            res.status(500).json({ error: "Error al obtener producto" });
        }
    }
);

module.exports = router;