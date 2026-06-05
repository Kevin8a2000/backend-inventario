const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 500;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white"
});

const generarGraficaDonut = async () => {

    const datos = [45, 32, 23];

    const total = datos.reduce((a, b) => a + b, 0);

    const configuration = {

        type: "doughnut",

        data: {

            labels: ["Electrónica", "Hogar", "Comida"],

            datasets: [
                {
                    data: datos,

                    backgroundColor: [
                        "#1E4E8C",
                        "#3B82F6",
                        "#93C5FD"
                    ],

                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        },

        options: {

            responsive: false,

            cutout: "72%",

            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            },

            plugins: {

                title: {
                    display: true,
                    text: "Stock por Categoría",
                    color: "#111827",

                    font: {
                        size: 24,
                        weight: "bold"
                    },

                    padding: {
                        bottom: 25
                    }
                },

                legend: {

                    position: "bottom",

                    labels: {

                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 30,

                        color: "#374151",

                        font: {
                            size: 15,
                            weight: "bold"
                        },

                        generateLabels(chart) {

                            return chart.data.labels.map((label, i) => {

                                const porcentaje = Math.round(
                                    (datos[i] / total) * 100
                                );

                                return {
                                    text: `${label} ${porcentaje}%`,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    strokeStyle: chart.data.datasets[0].backgroundColor[i],
                                    lineWidth: 0,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                }
            }
        },

        plugins: [

            {
                id: "centerText",

                beforeDraw(chart) {

                    const { width } = chart;
                    const { height } = chart;
                    const ctx = chart.ctx;

                    ctx.restore();

                    // 🔥 NÚMERO GRANDE
                    ctx.font = "bold 48px sans-serif";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#111827";

                    const text = "2,854";

                    const textX =
                        Math.round(
                            (width - ctx.measureText(text).width) / 2
                        );

                    const textY = height / 2 - 18;

                    ctx.fillText(text, textX, textY);

                    // 🔥 TEXTO TOTAL STOCK
                    ctx.font = "bold 18px sans-serif";
                    ctx.fillStyle = "#6B7280";

                    const subText = "TOTAL STOCK";

                    const subX =
                        Math.round(
                            (width - ctx.measureText(subText).width) / 2
                        );

                    ctx.fillText(subText, subX, height / 2 + 35);

                    ctx.save();
                }
            }
        ]
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
};

module.exports = generarGraficaDonut;