const PDFDocument = require("pdfkit");

const Movimiento =
require("../models/Movimiento");

const generarGraficaMensual =
require("./graficas");

const generarGraficaDonut =
require("./graficasDonut");

// =====================================================
// 🚀 GENERAR PDF
// =====================================================

const generarPDF = async (filtros = {}) => {

    try {

        const doc = new PDFDocument({

            margin: 40,

            size: "A4"
        });

        // =====================================================
        // 🔥 BUFFER PDF
        // =====================================================

        const buffers = [];

        doc.on(
            "data",
            buffers.push.bind(buffers)
        );

        // =====================================================
        // 🔥 TÍTULO
        // =====================================================

        doc.fontSize(22)
            .fillColor("#1e3a8a")
            .text("REPORTE DE INVENTARIO", {

                align: "center"
            });

        doc.moveDown(0.5);

        doc.fontSize(10)
            .fillColor("#6b7280")
            .text(

                `Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`,

                {
                    align: "center"
                }
            );

        doc.moveDown(2);

        // =====================================================
        // 🔥 QUERY
        // =====================================================

        const query = {};

        // =====================================================
        // 📅 FILTRO FECHAS
        // =====================================================

        if (

            filtros.fechaInicio &&
            filtros.fechaFin

        ) {

            const inicio = new Date(filtros.fechaInicio);
            inicio.setUTCHours(0, 0, 0, 0);

            const fin = new Date(filtros.fechaFin);
            fin.setUTCHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: inicio,
                $lte: fin
            };

        } else {
            // sin restricción de fecha — trae todos los movimientos
        }

        // =====================================================
        // 🔥 FILTRO TIPO
        // =====================================================

        if (

            filtros.tipo &&
            filtros.tipo !== "todos"

        ) {

            query.tipo = filtros.tipo;
        }

        // =====================================================
        // 🔥 CONSULTA
        // =====================================================

        let movimientosQuery =
            Movimiento.find(query)

                .populate({

                    path: "producto",

                    populate: {

                        path: "categoria"
                    }
                });

        // =====================================================
        // 🔥 ORDEN
        // =====================================================

        if (filtros.orden === "recientes") {
            movimientosQuery = movimientosQuery.sort({ createdAt: -1 });
        } else if (filtros.orden === "antiguos") {
            movimientosQuery = movimientosQuery.sort({ createdAt: 1 });
        } else if (filtros.orden === "mayor") {
            movimientosQuery = movimientosQuery.sort({ cantidad: -1 });
        } else if (filtros.orden === "menor") {
            movimientosQuery = movimientosQuery.sort({ cantidad: 1 });
        } else {
            movimientosQuery = movimientosQuery.sort({ createdAt: -1 });
        }

        const movimientos =
            await movimientosQuery;

        // =====================================================
        // 🔥 VALIDOS
        // =====================================================

        let validos =
            movimientos.filter(
                m => m.producto
            );

        // =====================================================
        // 🔥 FILTRO PRODUCTO
        // =====================================================

        if (

            filtros.producto &&
            filtros.producto !== "todos"

        ) {

            validos = validos.filter(m => {

                return m.producto.nombre

                    .toLowerCase()

                    .includes(
                        filtros.producto.toLowerCase()
                    );
            });
        }

        // =====================================================
        // 🔥 FILTRO CATEGORIA
        // =====================================================

        if (

            filtros.categoria &&
            filtros.categoria !== "todos"

        ) {

            validos = validos.filter(m => {

                if (!m.producto.categoria) {
                    return false;
                }

                const nombreCategoria =

                    typeof m.producto.categoria === "object"

                        ? m.producto.categoria.nombre

                        : m.producto.categoria;

                if (!nombreCategoria) {
                    return false;
                }

                return nombreCategoria

                    .toLowerCase()

                    .includes(
                        filtros.categoria.toLowerCase()
                    );
            });
        }

        // =====================================================
        // ❌ SIN DATOS
        // =====================================================

        if (validos.length === 0) {

            doc.fontSize(16)
                .fillColor("#6b7280")
                .text("No se encontraron movimientos para los filtros seleccionados.", {
                    align: "center"
                });

            doc.end();

            return await new Promise((resolve, reject) => {
                doc.on("end", () => resolve(Buffer.concat(buffers)));
                doc.on("error", reject);
            });
        }

        // =====================================================
        // 🔥 AGRUPAR POR MES
        // =====================================================

        const grupos = {};

        validos.forEach(mov => {

            const fecha =
                new Date(mov.createdAt);

            const mes =
                `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;

            if (!grupos[mes]) {

                grupos[mes] = [];
            }

            grupos[mes].push(mov);
        });

        const mesesOrdenados =
            Object.keys(grupos).sort();

        let totalEntradasGlobal = 0;

        let totalSalidasGlobal = 0;

        // =====================================================
        // 🔥 RECORRER MESES
        // =====================================================

        for (const mes of mesesOrdenados) {

            doc.addPage();

            const lista = grupos[mes];

            const [year, month] =
                mes.split("-");

            const fechaBonita =
                new Date(year, month - 1);

            doc.fontSize(18)

                .fillColor("#111827")

                .text(

                    `MES: ${fechaBonita.toLocaleString("es-CO", { timeZone: 'America/Bogota',

                        month: "long",

                        year: "numeric"
                    })}`,

                    {
                        align: "center"
                    }
                );

            doc.moveDown(1.5);

            const startX = 40;

            let startY = doc.y;

            const colProducto = 170;

            const colTipo = 90;

            const colCantidad = 90;

            const colFecha = 140;

            const rowHeight = 24;

            const drawCell = (

                x,
                y,
                w,
                h,
                text,
                header = false

            ) => {

                if (header) {

                    doc.fillColor("#1e3a8a")

                        .rect(x, y, w, h)

                        .fill();

                } else {

                    doc.fillColor("#ffffff")

                        .rect(x, y, w, h)

                        .fillAndStroke(

                            "#ffffff",

                            "#d1d5db"
                        );
                }

                doc.fillColor(

                    header
                        ? "#ffffff"
                        : "#111827"
                )

                    .fontSize(10)

                    .text(

                        text,

                        x + 5,

                        y + 7,

                        {

                            width: w - 10,

                            align: "center"
                        }
                    );
            };

            const drawHeader = () => {

                drawCell(

                    startX,

                    startY,

                    colProducto,

                    rowHeight,

                    "Producto",

                    true
                );

                drawCell(

                    startX + colProducto,

                    startY,

                    colTipo,

                    rowHeight,

                    "Tipo",

                    true
                );

                drawCell(

                    startX + colProducto + colTipo,

                    startY,

                    colCantidad,

                    rowHeight,

                    "Cantidad",

                    true
                );

                drawCell(

                    startX + colProducto + colTipo + colCantidad,

                    startY,

                    colFecha,

                    rowHeight,

                    "Fecha",

                    true
                );

                startY += rowHeight;
            };

            drawHeader();

            let entradas = 0;

            let salidas = 0;

            const topEntradas = {};

            const topSalidas = {};

            lista.forEach((mov) => {

                if (startY > 700) {

                    doc.addPage();

                    startY = 50;

                    drawHeader();
                }

                drawCell(

                    startX,

                    startY,

                    colProducto,

                    rowHeight,

                    mov.producto.nombre
                );

                drawCell(

                    startX + colProducto,

                    startY,

                    colTipo,

                    rowHeight,

                    mov.tipo
                );

                drawCell(

                    startX + colProducto + colTipo,

                    startY,

                    colCantidad,

                    rowHeight,

                    mov.cantidad.toString()
                );

                drawCell(

                    startX + colProducto + colTipo + colCantidad,

                    startY,

                    colFecha,

                    rowHeight,

                    new Date(
                        mov.createdAt
                    ).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
                );

                const nombre =
                    mov.producto.nombre;

                if (mov.tipo === "entrada") {

                    entradas += mov.cantidad;

                    totalEntradasGlobal += mov.cantidad;

                    topEntradas[nombre] =

                        (topEntradas[nombre] || 0)

                        + mov.cantidad;

                } else {

                    salidas += mov.cantidad;

                    totalSalidasGlobal += mov.cantidad;

                    topSalidas[nombre] =

                        (topSalidas[nombre] || 0)

                        + mov.cantidad;
                }

                startY += rowHeight;
            });

            // =====================================================
            // 🔥 RESUMEN DEL MES
            // =====================================================

            doc.moveDown(2);

            doc.fontSize(14)

                .fillColor("#1e3a8a")

                .text("RESUMEN DEL MES");

            doc.moveDown(0.5);

            doc.fontSize(11)

                .fillColor("#111827");

            doc.text(`Entradas: ${entradas}`);

            doc.text(`Salidas: ${salidas}`);

            doc.text(
                `Balance: ${entradas - salidas}`
            );
        }

        // =====================================================
        // 🔥 RESUMEN GENERAL
        // =====================================================

        doc.addPage();

        doc.fontSize(20)

            .fillColor("#1e3a8a")

            .text("RESUMEN GENERAL", {

                align: "center"
            });

        doc.moveDown(1);

        const cardsY = doc.y;

        const drawCard = (
            x,
            title,
            value,
            color
        ) => {

            doc.roundedRect(
                x,
                cardsY,
                160,
                70,
                10
            )

                .fillAndStroke(
                    "#ffffff",
                    "#e5e7eb"
                );

            doc.fillColor("#6b7280")

                .fontSize(10)

                .text(
                    title,
                    x + 15,
                    cardsY + 15
                );

            doc.fillColor(color)

                .fontSize(20)

                .text(
                    value,
                    x + 15,
                    cardsY + 35
                );
        };

        drawCard(

            40,

            "TOTAL ENTRADAS",

            totalEntradasGlobal,

            "#16a34a"
        );

        drawCard(

            220,

            "TOTAL SALIDAS",

            totalSalidasGlobal,

            "#dc2626"
        );

        drawCard(

            400,

            "BALANCE",

            totalEntradasGlobal - totalSalidasGlobal,

            "#2563eb"
        );

        // =====================================================
        // 🔥 GRÁFICAS
        // =====================================================

        const grafica =
            await generarGraficaMensual(validos);

        const donut =
            await generarGraficaDonut();

        const graficasY =
            cardsY + 110;

        doc.image(

            grafica,

            50,

            graficasY + 45,

            {
                fit: [320, 210]
            }
        );

        doc.image(

            donut,

            410,

            graficasY + 45,

            {
                fit: [140, 200]
            }
        );

        // =====================================================
        // 🔥 FINALIZAR PDF
        // =====================================================

        doc.end();

        return await new Promise((resolve, reject) => {

            doc.on("end", () => {

                const pdfBuffer =
                    Buffer.concat(buffers);

                resolve(pdfBuffer);
            });

            doc.on("error", reject);
        });

    } catch (error) {

        console.log("ERROR PDF:", error);

        throw error;
    }
};

module.exports = generarPDF;