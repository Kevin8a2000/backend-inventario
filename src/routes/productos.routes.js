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
            let productos = await Producto.find({ usaLotes: true }).populate("categoria");
            const hoy = new Date();

            if (search && typeof search === 'string') {
                const texto = sanitizarTexto(search).toLowerCase();
                if (texto) {
                    productos = productos.filter(p => {
                        return [p.nombre, p.marca, p.lote, p.sku]
                            .some(value => typeof value === 'string' && value.toLowerCase().includes(texto));
                    });
                }
            }

            if (estado && typeof estado === 'string') {
                productos = productos.filter(p => {
                    const fecha = new Date(p.fechaVencimiento);
                    if (estado === "vencido") return fecha < hoy;
                    if (estado === "agotado") return p.stock <= 0;
                    if (estado === "activo") return p.stock > 0 && fecha >= hoy;
                    return true;
                });
            }

            const lotes = productos.map(p => ({
                id: p._id,
                producto: p.nombre,
                marca: p.marca,
                categoria: p.categoria?.nombre,
                lote: p.lote,
                sku: p.sku,
                fechaVencimiento: p.fechaVencimiento,
                stock: p.stock
            }));

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
            const totalLotes = productos.length;
            const activos = productos.filter(p => p.stock > 0).length;
            const agotados = productos.filter(p => p.stock <= 0).length;
            const hoy = new Date();
            const proximosVencer = productos.filter(p => {
                if (!p.fechaVencimiento) return false;
                const fecha = new Date(p.fechaVencimiento);
                const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
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
                await enviarCorreo(
                    process.env.EMAIL_TO,
                    "🔥 Reposición grande detectada",
                    `Producto: ${producto.nombre}\n\nStock anterior: ${stockAnterior}\nCantidad agregada: ${cantidad}\n\nNuevo stock: ${producto.stock}`
                );
            }

            res.json({ mensaje: "Stock repuesto correctamente", producto });
        } catch (error) {
            console.error("Error al reponer stock:", error);
            res.status(500).json({ error: "Error al reponer stock" });
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
            const { lote, nombre, sku, stock, fechaVencimiento, observacionLote } = req.body;
            const producto = await Producto.findById(req.params.id);
            if (!producto) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            const stockAnterior = producto.stock;
            // SKU y nombre NO se modifican desde edición de lote — tienen índice único
            if (lote !== undefined) producto.lote = {
                ...producto.lote,
                codigo: sanitizarTexto(String(lote))
            };
            if (stock !== undefined) producto.stock = Number(stock);
            if (fechaVencimiento !== undefined) producto.fechaVencimiento = fechaVencimiento || null;
            if (observacionLote !== undefined) producto.observacionLote = sanitizarTexto(observacionLote);

            await producto.save();

            await crearNotificacion(
                "Lote actualizado",
                `El lote ${producto.lote?.codigo || producto.lote} fue actualizado.`,
                "info"
            );

            await enviarCorreo(
                process.env.EMAIL_TO,
                "✏️ Lote actualizado",
                `Producto: ${producto.nombre}\n\nLote: ${producto.lote}\n\nSKU: ${producto.sku}\n\nStock anterior: ${stockAnterior}\n\nNuevo stock: ${producto.stock}`
            );

            res.json({ mensaje: "Lote actualizado correctamente", producto });
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