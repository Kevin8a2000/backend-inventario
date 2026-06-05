const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");

const verificarToken = require("../middlewares/auth");


// 📊 RESUMEN DASHBOARD
router.get("/resumen", verificarToken, async (req, res) => {

    try {

        // 📌 TOTAL INVENTARIO
        const productos = await Producto.find();

        const valorInventario = productos.reduce((total, producto) => {

            return total + (
                producto.precio * producto.stock
            );

        }, 0);

        // 📌 PRODUCTOS CRÍTICOS
        const productosCriticos =
            await Producto.countDocuments({

                $expr: {
                    $lte: ["$stock", "$stockMinimo"]
                }
            });

        // 📌 FECHA ACTUAL
        const hoy = new Date();

        const inicioMes = new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1
        );

        const finMes = new Date(
            hoy.getFullYear(),
            hoy.getMonth() + 1,
            0,
            23,
            59,
            59
        );

        // 📌 MOVIMIENTOS DEL MES
        const movimientos = await Movimiento.find({

            createdAt: {
                $gte: inicioMes,
                $lte: finMes
            }
        });

        // 📌 ENTRADAS
        const entradasMes = movimientos
            .filter(m => m.tipo === "entrada")
            .reduce((acc, mov) => {

                return acc + mov.cantidad;

            }, 0);

        // 📌 SALIDAS
        const salidasMes = movimientos
            .filter(m => m.tipo === "salida")
            .reduce((acc, mov) => {

                return acc + mov.cantidad;

            }, 0);

        // ✅ RESPUESTA
        res.json({

            valorInventario,
            entradasMes,
            salidasMes,
            productosCriticos
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error: "Error al obtener resumen dashboard"
        });
    }
});


// 📈 TENDENCIA MOVIMIENTOS
router.get("/tendencia", verificarToken, async (req, res) => {

    try {

        const diasSemana = [

            "DOM",
            "LUN",
            "MAR",
            "MIE",
            "JUE",
            "VIE",
            "SAB"
        ];

        // 🔥 ÚLTIMOS 7 DÍAS
        const hace7Dias = new Date();

        hace7Dias.setDate(
            hace7Dias.getDate() - 6
        );

        // 🔥 MOVIMIENTOS
        const movimientos = await Movimiento.find({

            createdAt: {
                $gte: hace7Dias
            }
        });

        // 🔥 ESTRUCTURA BASE
        const tendencia = {};

        diasSemana.forEach(dia => {

            tendencia[dia] = {

                dia,
                entradas: 0,
                salidas: 0
            };
        });

        // 🔥 AGRUPAR
        movimientos.forEach(mov => {

            const fecha =
                new Date(mov.createdAt);

            const nombreDia =
                diasSemana[fecha.getDay()];

            if (mov.tipo === "entrada") {

                tendencia[nombreDia].entradas +=
                    mov.cantidad;

            } else {

                tendencia[nombreDia].salidas +=
                    mov.cantidad;
            }
        });

        // ✅ RESPUESTA
        res.json(
            Object.values(tendencia)
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({

            error: "Error obteniendo tendencia"
        });
    }
});

module.exports = router;