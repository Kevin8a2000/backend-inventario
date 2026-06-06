require("dotenv").config();

// =====================================================
// 🚀 IMPORTS
// =====================================================

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");

require("./src/jobs/alertasStock.job");

// 🚨 SERVICIO VENCIMIENTOS
const revisarVencimientos =
require("./src/services/vencimientos.service");

// =====================================================
// 🔥 IMPORTAR RUTAS
// =====================================================

const reportesRoutes =
require("./src/routes/reportes.routes");

const usuariosRoutes =
require("./src/routes/usuarios.routes");

const productosRoutes =
require("./src/routes/productos.routes");

const authRoutes =
require("./src/routes/auth.routes");

const movimientosRoutes =
require("./src/routes/movimientos.routes");

const categoriasRoutes =
require("./src/routes/categorias.routes");

const dashboardRoutes =
require("./src/routes/dashboard.routes");

const aiRoutes =
require("./src/routes/ai.routes");

const notificacionesRoutes =
require("./src/routes/notificaciones.routes");

const permisosRoutes =
require("./src/routes/permisos.routes");

// =====================================================
// 🔥 CREAR APP
// =====================================================

const app = express();

// =====================================================
// 🔥 CONECTAR BASE DE DATOS
// =====================================================

connectDB();

// =====================================================
// 🔒 TRUST PROXY (requerido para Render / proxies inversos)
// =====================================================

app.set('trust proxy', 1);

// =====================================================

// � HELMET - Headers de Seguridad
// =====================================================

const helmet = require("helmet");
app.use(helmet());

// =====================================================
// 🔒 RATE LIMITING
// =====================================================

const rateLimit = require("express-rate-limit");

// Limiter general para toda la API
const limiterGeneral = rateLimit({
    windowMs: 60 * 1000,  // 1 minuto
    max: 100,
    message: {
        ok: false,
        error: "Demasiadas solicitudes. Espera un momento."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter estricto para autenticación
const limiterAuth = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,
    message: {
        ok: false,
        error: "Demasiados intentos de autenticación. Espera 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Aplicar limiter general a toda la API
app.use(limiterGeneral);

// =====================================================
// 🔒 CORS MEJORADO
// =====================================================

const origenesPermitidos = [
    process.env.FRONTEND_URL || null,
    process.env.VERCEL_URL || null,
    "https://invenstock-la-costa.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permite peticiones sin origen (Postman, apps móviles, curl)
        if (!origin || origenesPermitidos.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Origen no permitido por CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 3600
}));

// Exportar limiterAuth para las rutas
app.locals.limiterAuth = limiterAuth;

// =====================================================
// 🔥 MIDDLEWARES
// =====================================================

app.use(express.json({
    limit: '200kb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '200kb',
    parameterLimit: 50
}));

// =====================================================
// 🔥 RUTAS API
// =====================================================

// 📊 DASHBOARD
app.use(
    "/api/dashboard",
    dashboardRoutes
);

// 📑 REPORTES
app.use(
    "/api/reporte",
    reportesRoutes
);

app.use(
    "/api/reportes",
    reportesRoutes
);

// 👥 USUARIOS
app.use(
    "/api/usuarios",
    usuariosRoutes
);

// � USUARIO (Alias singular)
app.use(
    "/api/usuario",
    usuariosRoutes
);

// 🔐 ADMIN / PERMISOS
app.use(
    "/api/admin",
    permisosRoutes
);

// ��📦 PRODUCTOS
app.use(
    "/api/productos",
    productosRoutes
);

// 🔐 AUTH
app.use(
    "/api/auth",
    authRoutes
);

// 🔄 MOVIMIENTOS
app.use(
    "/api/movimientos",
    movimientosRoutes
);

// 📂 CATEGORÍAS
app.use(
    "/api/categorias",
    categoriasRoutes
);

// 🤖 IA
app.use(
    "/api/ai",
    aiRoutes
);

// 🔔 NOTIFICACIONES
app.use(
    "/api/notificaciones",
    notificacionesRoutes
);

// 🔐 PERMISOS
app.use(
    "/api/permisos",
    permisosRoutes
);

// =====================================================
// 🔥 RUTA BASE
// =====================================================

app.get("/", (req, res) => {

    res.status(200).json({

        ok: true,

        mensaje:
            "API funcionando correctamente 🚀",

        version: "1.0.0"
    });
});

// =====================================================
// ❌ RUTA NO ENCONTRADA
// =====================================================

app.use((req, res) => {

    res.status(404).json({

        ok: false,

        error:
            "Ruta no encontrada"
    });
});

// =====================================================
// 🚨 MANEJO GLOBAL DE ERRORES
// =====================================================

app.use((error, req, res, next) => {

    console.log("❌ ERROR GLOBAL:");
    console.log(error);

    res.status(500).json({

        ok: false,

        error:
            "Error interno del servidor"
    });
});

// =====================================================
// 🔥 PUERTO
// =====================================================

const PORT =
process.env.PORT || 3000;

// =====================================================
// 🚀 SERVIDOR
// =====================================================

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: origenesPermitidos,
        methods: ["GET", "POST"],
        credentials: true,
        maxAge: 3600
    },
    transports: ['websocket', 'polling']
});

// 🔥 HACER GLOBAL SOCKET
app.set("io", io);

// � INICIAR ALERTAS VENCIMIENTO CON SOCKET
revisarVencimientos(io);

// �🔥 CONEXIONES
io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado");

    socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado");
    });
});

// 🚀 INICIAR SERVIDOR
server.listen(PORT, () => {
    console.log(
        `🚀 Servidor iniciado en http://localhost:${PORT}`
    );
});