require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");

const app = express(); // 🔥 PRIMERO se crea app

// conectar DB
connectDB();

// middlewares
app.use(express.json());

// 🔽 IMPORTAR RUTAS
const usuariosRoutes = require("./src/routes/usuarios.routes");
const productosRoutes = require("./src/routes/productos.routes");
const authRoutes = require("./src/routes/auth.routes");
const movimientosRoutes = require("./src/routes/movimientos.routes");
const categoriasRoutes = require("./src/routes/categorias.routes");

// 🔽 USAR RUTAS
app.use("/usuarios", usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/auth", authRoutes);
app.use("/movimientos", movimientosRoutes);
app.use("/categorias", categoriasRoutes);

// ruta base
app.get("/", (req, res) => {
    res.send("API funcionando");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});