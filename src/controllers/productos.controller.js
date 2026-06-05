const Producto = require("../models/Producto");
const { escaparHTML, limitarLongitud } = require("../utils/sanitizar");

// Normaliza el campo lote en objetos planos devueltos por .lean()
function normalizarLote(p) {
    if (!p.lote || typeof p.lote !== 'object' || Array.isArray(p.lote)) {
        p.lote = { codigo: 'S/N', fechaEntrada: p.createdAt || new Date() };
    } else if (!p.lote.codigo) {
        p.lote.codigo = 'S/N';
    }
    return p;
}

// GET - obtener todos los productos
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.find()
            .populate("categoria", "nombre")
            .lean();

        const productosLimpios = productos.map(p => {
            normalizarLote(p);
            return {
                ...p,
                nombre:      escaparHTML(p.nombre      || ""),
                descripcion: escaparHTML(p.descripcion || ""),
                marca:       escaparHTML(p.marca       || "")
            };
        });

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

// POST - crear producto
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
            observacionLote,
            imagen
        } = req.body;

        const nombreLimpio      = escaparHTML(limitarLongitud(nombre, 100));
        const descripcionLimpia = escaparHTML(limitarLongitud(descripcion || "", 500));
        const marcaLimpia       = escaparHTML(limitarLongitud(marca || "", 100));
        const skuLimpio         = sku.trim().toUpperCase();

        const existeSKU = await Producto.findOne({ sku: skuLimpio });
        if (existeSKU) {
            return res.status(400).json({ ok: false, error: "El SKU ya existe" });
        }

        if (usaLotes) {
            if (!lote || typeof lote !== 'object' || !lote.codigo) {
                return res.status(400).json({
                    ok: false,
                    error: "El código de lote (lote.codigo) es obligatorio cuando se usa control de lotes"
                });
            }
        }

        // Garantizar que lote.codigo siempre tenga valor antes del save
        const loteNormalizado =
            (usaLotes && lote && typeof lote === 'object' && lote.codigo)
                ? lote
                : { codigo: 'N/A', fechaEntrada: new Date() };

        const nuevoProducto = new Producto({
            nombre:           nombreLimpio,
            descripcion:      descripcionLimpia,
            marca:            marcaLimpia,
            sku:              skuLimpio,
            categoria,
            precio:           Number(precio),
            stock:            Number(stock),
            stockMinimo:      Number(stockMinimo) || 0,
            movimientoMaximo: Number(movimientoMaximo) || 50,
            usaLotes:         usaLotes || false,
            lote:             loteNormalizado,
            fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
            diasAlerta:       Number(diasAlerta) || 30,
            observacionLote:  escaparHTML(limitarLongitud(observacionLote || "", 300)),
            imagen:           imagen || null
        });

        await nuevoProducto.save();

        res.status(201).json({
            ok: true,
            mensaje: "Producto creado correctamente",
            producto: nuevoProducto
        });

    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ ok: false, error: "Error al crear producto" });
    }
};

// PUT - actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const productoAnterior = await Producto.findById(req.params.id);

        if (!productoAnterior) {
            return res.status(404).json({ ok: false, error: "Producto no encontrado" });
        }

        const camposPermitidos = [
            'nombre', 'descripcion', 'marca', 'precio',
            'stock', 'stockMinimo', 'movimientoMaximo', 'categoria', 'imagen'
        ];
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
        res.status(500).json({ ok: false, error: "Error al actualizar producto" });
    }
};

// DELETE - eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);

        if (!producto) {
            return res.status(404).json({ ok: false, error: "Producto no encontrado" });
        }

        res.json({ ok: true, mensaje: "Producto eliminado correctamente" });

    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ ok: false, error: "Error al eliminar producto" });
    }
};

// GET - productos con stock bajo
exports.obtenerStockBajo = async (req, res) => {
    try {
        const productos = await Producto.find({
            $expr: { $lte: ["$stock", "$stockMinimo"] }
        })
        .populate("categoria", "nombre")
        .sort({ stock: 1 })
        .lean();

        productos.forEach(normalizarLote);

        res.json(productos);

    } catch (error) {
        console.error("Error al obtener productos con stock bajo:", error);
        res.status(500).json({ ok: false, error: "Error al obtener productos con stock bajo" });
    }
};

// GET - valor total del inventario
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
        res.status(500).json({ ok: false, error: "Error al calcular inventario" });
    }
};
