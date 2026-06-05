const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 1000;
const height = 450;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white"
});

// 📊 GRÁFICA DE MOVIMIENTOS
const generarGraficaMensual = async (movimientos) => {

    const diasOrdenados = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

    const dias = {};

    diasOrdenados.forEach(d => {
        dias[d] = { entrada: 0, salida: 0 };
    });

    movimientos.forEach(mov => {

        const fecha = new Date(mov.createdAt);

        const dia = fecha
            .toLocaleDateString("es-ES", { weekday: "short" })
            .replace(".", "")
            .toLowerCase();

        if (!dias[dia]) {
            dias[dia] = { entrada: 0, salida: 0 };
        }

        if (mov.tipo === "entrada") {
            dias[dia].entrada += mov.cantidad;
        } else {
            dias[dia].salida += mov.cantidad;
        }
    });

    const labels = diasOrdenados.map(d => d.toUpperCase());

    const entradas = diasOrdenados.map(d => dias[d].entrada);
    const salidas = diasOrdenados.map(d => dias[d].salida);

    const configuration = {

        type: "bar",

        data: {

            labels,

            datasets: [

                {
                    label: "Entradas",
                    data: entradas,
                    backgroundColor: "#1E4E8C",
                    borderRadius: 8,
                    barThickness: 28
                },

                {
                    label: "Salidas",
                    data: salidas,
                    backgroundColor: "#CBD5E1",
                    borderRadius: 8,
                    barThickness: 28
                }
            ]
        },

        options: {

            responsive: false,

            plugins: {

                title: {
                    display: true,
                    text: "Tendencia de Movimientos",
                    color: "#111827",

                    font: {
                        size: 22,
                        weight: "bold"
                    },

                    padding: {
                        bottom: 30
                    }
                },

                legend: {

                    position: "top",
                    align: "end",

                    labels: {

                        color: "#374151",
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 20,

                        font: {
                            size: 13,
                            weight: "bold"
                        }
                    }
                }
            },

            layout: {
                padding: 20
            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    ticks: {

                        color: "#6B7280",

                        font: {
                            size: 12,
                            weight: "bold"
                        }
                    }
                },

                y: {

                    beginAtZero: true,

                    grid: {
                        color: "#E5E7EB"
                    },

                    ticks: {

                        color: "#6B7280",

                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
};

module.exports = generarGraficaMensual;