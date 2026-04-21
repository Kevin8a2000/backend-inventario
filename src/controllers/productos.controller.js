const Producto = require("../models/Producto");

// ✅ GET - obtener todos los productos
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: "Error al obtener productos" });
    }
};

// ✅ POST - crear producto
exports.crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, sku, categoria, precio, stock, stockMinimo,  movimientoMaximo} = req.body;

        console.log("BODY:", req.body);
        console.log("movimientoMaximo recibido:", movimientoMaximo);
        
            // 🔴 VALIDAR SKU DUPLICADO (AQUÍ VA)
        const existeSKU = await Producto.findOne({ sku });

        if (existeSKU) {
        return res.status(400).json({
            error: "El SKU ya existe"
        });
        }

        // 🟢 CREAR PRODUCTO
        const nuevoProducto = new Producto({
            nombre,
            descripcion,
            sku,
            categoria,
            precio,
            stock,
            stockMinimo,
            movimientoMaximo: Number(movimientoMaximo) || 50

        });
        
        
        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: "Error al crear producto" });
    }
};

// ✅ PUT - actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        res.json(producto);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: "Error al actualizar producto" });
    }
};

// ✅ DELETE - eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        res.json({ mensaje: "Producto eliminado" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: "Error al eliminar producto" });
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
        console.log(error);
        res.status(500).json({ mensaje: "Error al obtener productos con stock bajo" });
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
        console.log(error);
        res.status(500).json({ mensaje: "Error al calcular inventario" });
    }
};