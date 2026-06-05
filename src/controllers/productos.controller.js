const Producto = require("../models/Producto");
const { escaparHTML, sanitizarObjeto, limitarLongitud, limpiarObjeto} = require("../utils/sanitizar");
const { enviarCorreo } = require("../utils/email");

// ✅ GET - obtener todos los productos
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.find()
            .populate("categoria", "nombre");

        // Sanitizar datos de respuesta
        const productosLimpios = productos.map(p => ({
            ...p.toObject(),
            nombre: escaparHTML(p.nombre),
            descripcion: escaparHTML(p.descripcion),
            marca: escaparHTML(p.marca)
        }));

        res.json({
            ok: true,
            data: productosLimpios,
            total: productosLimpios.length
        });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({
            ok: false,
            error: "Error al obtener productos"
        });
    }
};

// ✅ POST - crear producto
exports.crearProducto = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            marca,
            sku,
            categoria,
            precio,
            stock,
            stockMinimo,
            movimientoMaximo,
            usaLotes,
            lote,
            fechaVencimiento,
            diasAlerta,
            observacionLote
        } = req.body;

        // 🔒 SANITIZAR INPUTS
        const nombreLimpio = escaparHTML(limitarLongitud(nombre, 100));
        const descripcionLimpia = escaparHTML(limitarLongitud(descripcion || "", 500));
        const marcaLimpia = escaparHTML(limitarLongitud(marca || "", 100));
        const skuLimpio = sku.trim().toUpperCase();

        // 🔴 VALIDAR SKU DUPLICADO
        const existeSKU = await Producto.findOne({ sku: skuLimpio });

        if (existeSKU) {
            return res.status(400).json({
                ok: false,
                error: "El SKU ya existe"
            });
        }

        // =====================================================
        // 🔥 VALIDACIÓN CONTROL LOTES
        // =====================================================

        if (usaLotes) {
            if (!lote || Object.keys(lote).length === 0) {
                return res.status(400).json({
                    ok: false,
                    error: "El lote es obligatorio"
                });
            }

            if (!fechaVencimiento) {
                return res.status(400).json({
                    ok: false,
                    error: "La fecha de vencimiento es obligatoria"
                });
            }
        }

        // 🟢 CREAR PRODUCTO
        const nuevoProducto = new Producto({
            nombre: nombreLimpio,
            descripcion: descripcionLimpia,
            marca: marcaLimpia,
            sku: skuLimpio,
            categoria,
            precio: Number(precio),
            stock: Number(stock),
            stockMinimo: Number(stockMinimo) || 0,
            movimientoMaximo: Number(movimientoMaximo) || 50,

            // 🔥 CONTROL LOTES
            usaLotes: usaLotes || false,
            lote: limpiarObjeto(lote || ""),
            fechaVencimiento: fechaVencimiento
                ? new Date(fechaVencimiento)
                : null|| null,
            diasAlerta: Number(diasAlerta) || 30,
            observacionLote: escaparHTML(limitarLongitud(observacionLote || "", 300))
        });

        await nuevoProducto.save();

        res.status(201).json({
            ok: true,
            mensaje: "Producto creado correctamente",
            producto: nuevoProducto
        });

    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({
            ok: false,
            error: "Error al crear producto"
        });
    }
};

// ✅ PUT - actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const productoAnterior = await Producto.findById(req.params.id);

        if (!productoAnterior) {
            return res.status(404).json({
                ok: false,
                error: "Producto no encontrado"
            });
        }

        // =====================================================
        // 🔒 WHITELIST - Solo campos permitidos
        // =====================================================

        const camposPermitidos = ['nombre', 'descripcion', 'marca', 'precio', 'stock', 'stockMinimo', 'movimientoMaximo', 'categoria'];
        const datosActualizacion = {};

        for (const campo of camposPermitidos) {
            if (req.body.hasOwnProperty(campo)) {
                if (campo === 'nombre') {
                    datosActualizacion[campo] = escaparHTML(limitarLongitud(req.body[campo], 100));
                } else if (campo === 'descripcion') {
                    datosActualizacion[campo] = escaparHTML(limitarLongitud(req.body[campo] || "", 500));
                } else if (campo === 'marca') {
                    datosActualizacion[campo] = escaparHTML(limitarLongitud(req.body[campo] || "", 100));
                } else if (['precio', 'stock', 'stockMinimo', 'movimientoMaximo'].includes(campo)) {
                    datosActualizacion[campo] = Number(req.body[campo]);
                } else {
                    datosActualizacion[campo] = req.body[campo];
                }
            }
        }

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            datosActualizacion,
            { new: true, runValidators: true }
        );

        res.json({
            ok: true,
            mensaje: "Producto actualizado correctamente",
            producto: productoActualizado
        });

    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({
            ok: false,
            error: "Error al actualizar producto"
        });
    }
};

// ✅ DELETE - eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);

        if (!producto) {
            return res.status(404).json({
                ok: false,
                error: "Producto no encontrado"
            });
        }

        res.json({
            ok: true,
            mensaje: "Producto eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({
            ok: false,
            error: "Error al eliminar producto"
        });
    }
};

// 🟢 GET - productos con stock bajo
exports.obtenerStockBajo = async (req, res) => {
    try {
        const productos = await Producto.find({
            $expr: { $lte: ["$stock", "$stockMinimo"] }
        });

        res.json(productos);

    } catch (error) {
        console.error("Error al obtener productos con stock bajo:", error);
        res.status(500).json({
            ok: false,
            error: "Error al obtener productos con stock bajo"
        });
    }
};

// 🟣 GET - valor total del inventario
exports.obtenerValorInventario = async (req, res) => {
    try {
        const total = await Producto.aggregate([
            {
                $project: {
                    total: { $multiply: ["$precio", "$stock"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalInventario: { $sum: "$total" }
                }
            }
        ]);

        res.json(total[0] || { totalInventario: 0 });
    } catch (error) {
        console.error("Error al calcular inventario:", error);
        res.status(500).json({
            ok: false,
            error: "Error al calcular inventario"
        });
    }
};

// ✅ DELETE - eliminar producto
exports.eliminarProducto = async (req, res) => {

    try {

        const producto =
            await Producto.findByIdAndDelete(
                req.params.id
            );

        if (!producto) {

            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto eliminado"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al eliminar producto"
        });
    }
};

// =====================================================
// 🟢 GET - PRODUCTOS CON STOCK BAJO
// =====================================================

exports.obtenerStockBajo = async (req, res) => {

    try {

        const productos = await Producto.find({

            $expr: {
                $lte: ["$stock", "$stockMinimo"]
            }

        })
        .populate("categoria", "nombre")
        .sort({ stock: 1 });

        res.json(productos);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje:
                "Error al obtener productos con stock bajo"
        });
    }
};

// =====================================================
// 🟣 GET - VALOR TOTAL INVENTARIO
// =====================================================

exports.obtenerValorInventario = async (req, res) => {

    try {

        const total =
            await Producto.aggregate([

                {
                    $project: {

                        total: {

                            $multiply: [
                                "$precio",
                                "$stock"
                            ]
                        }
                    }
                },

                {
                    $group: {

                        _id: null,

                        totalInventario: {
                            $sum: "$total"
                        }
                    }
                }
            ]);

        res.json(
            total[0] || {
                totalInventario: 0
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje:
                "Error al calcular inventario"
        });
    }
};