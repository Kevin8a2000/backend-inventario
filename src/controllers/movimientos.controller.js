const Movimiento = require("../models/Movimiento");
const Producto = require("../models/Producto");
const enviarCorreo = require("../utils/email");
const Usuario = require("../models/Usuario");

// CREAR MOVIMIENTO
const crearMovimiento = async (req, res) => {
    try {
       const { producto, tipo } = req.body;
        
       const cantidad = Number(req.body.cantidad);

        const productoDB = await Producto.findById(producto);

        const usuarioDB = await Usuario.findById(req.usuario.id);

        if (!productoDB) {
            return res.status(404).json({ error: "Producto no existe" });
        }

        // VALIDAR STOCK EN SALIDA
        if (tipo === "salida" && productoDB.stock < cantidad) {
            return res.status(400).json({ error: "Stock insuficiente" });
        }

        // ACTUALIZAR STOCK
        if (tipo === "entrada") {
            productoDB.stock += cantidad;
        } else if (tipo === "salida") {
            productoDB.stock -= cantidad;
        }

        await productoDB.save();

        // 🔔 NOTIFICACIONES

// STOCK AGOTADO
if (productoDB.stock === 0 && usuarioDB.notificaciones.stockAgotado) {
    await enviarCorreo(
        "Producto sin stock",
        `El producto ${productoDB.nombre} se ha quedado sin stock`
    );
}

// STOCK BAJO
if (
    productoDB.stock <= productoDB.stockMinimo &&
    usuarioDB.notificaciones.stockBajo
)  {
    await enviarCorreo(
        "Alerta de stock bajo",
        `El producto ${productoDB.nombre} está por debajo del stock mínimo`
    );
}

// MOVIMIENTO GRANDE
 // 🔍 DEBUG (puedes borrarlo luego)
console.log("movimientoMaximo:", productoDB.movimientoMaximo);
console.log("cantidad:", cantidad);

// 🔥 LÓGICA SEGURA
const limite = Number(productoDB.movimientoMaximo) || 50;

console.log("LIMITE:", limite);

// MOVIMIENTO GRANDE       git status
const tipoTexto = tipo === "entrada" ? "ENTRADA" : "SALIDA";

if (
    cantidad >= limite &&
    usuarioDB.notificaciones.movimientoGrande
) {
    console.log("🔥 MOVIMIENTO GRANDE DETECTADO");

    await enviarCorreo(
        "Movimiento grande detectado",
        `Se registró una ${tipoTexto} de ${cantidad} unidades del producto ${productoDB.nombre}.
Stock actual: ${productoDB.stock}`
    );
}

        // CREAR MOVIMIENTO
        const movimiento = new Movimiento({
            producto,
            tipo,
            cantidad,
            usuario: req.usuario.id // viene del token
        });

        await movimiento.save();

        res.json(movimiento);

    } catch (error) {
    console.log("ERROR REAL:", error); // 👈 esto lo muestra en consola
    res.status(500).json({ error: error.message });
}

};

// OBTENER MOVIMIENTOS (con filtro)
const getMovimientos = async (req, res) => {
    try {
        const { producto, desde, hasta } = req.query;

        let filtro = {};

        // 🟣 FILTRO POR PRODUCTO
        if (producto) {
            filtro.producto = producto;
        }

        // 🟣 FILTRO POR FECHA
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
        res.status(500).json({ error: "Error al obtener movimientos" });
    }
};

// 🟣 RESUMEN DE MOVIMIENTOS (ENTRADAS VS SALIDAS)
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

        let resultado = {
            entrada: 0,
            salida: 0
        };

        resumen.forEach(item => {
            if (item._id === "entrada") {
                resultado.entrada = item.total;
            }
            if (item._id === "salida") {
                resultado.salida = item.total;
            }
        });

        res.json(resultado);

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener resumen de movimientos"
        });
    }
};

module.exports = {
    crearMovimiento,
    getMovimientos,
    obtenerResumenMovimientos
};