// =====================================================
// 🔒 MIDDLEWARE - VALIDACIÓN Y SANITIZACIÓN DE INPUTS
// =====================================================

const { body, query, param, validationResult } = require('express-validator');

// =====================================================
// 🛡️ MANEJADOR DE ERRORES DE VALIDACIÓN
// =====================================================

const manejarErroresValidacion = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            error: "Validación fallida",
            detalles: errors.array().map(err => ({
                campo: err.param,
                mensaje: err.msg
            }))
        });
    }
    next();
};

// =====================================================
// 📝 VALIDADORES PARA USUARIOS
// =====================================================

const validarRegistro = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    
    body('apellido')
        .trim()
        .notEmpty().withMessage('El apellido es obligatorio')
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio')
        .isEmail().withMessage('Email no válido')
        .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener mayúscula, minúscula y número'),
    
    body('confirmPassword')
        .notEmpty().withMessage('Debe confirmar la contraseña')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    manejarErroresValidacion
];

const validarLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio')
        .isEmail().withMessage('Email no válido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria'),
    
    manejarErroresValidacion
];

// =====================================================
// 📦 VALIDADORES PARA PRODUCTOS
// =====================================================

const validarProducto = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
        .trim()
        .optional()
        .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('marca')
        .trim()
        .optional()
        .isLength({ max: 100 }).withMessage('La marca no puede exceder 100 caracteres'),
    
    body('sku')
        .trim()
        .notEmpty().withMessage('El SKU es obligatorio')
        .isLength({ min: 1, max: 50 }).withMessage('El SKU debe tener entre 1 y 50 caracteres')
        .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('El SKU solo puede contener letras, números, guiones y guiones bajos'),
    
    body('categoria')
        .notEmpty().withMessage('La categoría es obligatoria')
        .isMongoId().withMessage('ID de categoría inválido'),
    
    body('precio')
        .notEmpty().withMessage('El precio es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0'),
    
    body('stock')
        .notEmpty().withMessage('El stock es obligatorio')
        .isInt({ min: 0 }).withMessage('El stock debe ser un número no negativo'),
    
    body('stockMinimo')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número no negativo'),
    
    body('movimientoMaximo')
        .optional()
        .isInt({ min: 1 }).withMessage('El movimiento máximo debe ser mayor a 0'),
    
    manejarErroresValidacion
];

const validarActualizacionProducto = [
    param('id')
        .isMongoId().withMessage('ID de producto inválido'),
    
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('marca')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('La marca no puede exceder 100 caracteres'),
    
    body('sku')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('El SKU debe tener entre 1 y 50 caracteres')
        .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('El SKU solo puede contener letras, números, guiones y guiones bajos'),
    
    body('categoria')
        .optional()
        .isMongoId().withMessage('ID de categoría inválido'),
    
    body('precio')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número no negativo'),
    
    body('stockMinimo')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número no negativo'),
    
    body('movimientoMaximo')
        .optional()
        .isInt({ min: 1 }).withMessage('El movimiento máximo debe ser mayor a 0'),
    
    manejarErroresValidacion
];

// =====================================================
// 📂 VALIDADORES PARA CATEGORÍAS
// =====================================================

const validarCategoria = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la categoría es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    
    manejarErroresValidacion
];

// =====================================================
// 🔄 VALIDADORES PARA MOVIMIENTOS
// =====================================================

const validarMovimiento = [
    body('producto')
        .notEmpty().withMessage('El ID del producto es obligatorio')
        .isMongoId().withMessage('ID de producto inválido'),
    
    body('tipo')
        .notEmpty().withMessage('El tipo de movimiento es obligatorio')
        .isIn(['entrada', 'salida']).withMessage('El tipo debe ser "entrada" o "salida"'),
    
    body('cantidad')
        .notEmpty().withMessage('La cantidad es obligatoria')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un número positivo'),
    
    manejarErroresValidacion
];

// =====================================================
// 🔍 VALIDADORES PARA PARÁMETROS ID
// =====================================================

const validarIdProducto = [
    param('id')
        .isMongoId().withMessage('ID de producto inválido'),
    
    manejarErroresValidacion
];

const validarIdUsuario = [
    param('id')
        .isMongoId().withMessage('ID de usuario inválido'),
    
    manejarErroresValidacion
];

const validarIdCategoria = [
    param('id')
        .isMongoId().withMessage('ID de categoría inválido'),
    
    manejarErroresValidacion
];

// =====================================================
// 🔐 VALIDADORES PARA RECUPERAR CONTRASEÑA
// =====================================================

const validarRecuperarPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es obligatorio')
        .isEmail().withMessage('Email no válido')
        .normalizeEmail(),
    
    manejarErroresValidacion
];

const validarResetPassword = [
    param('token')
        .notEmpty().withMessage('El token es obligatorio'),
    
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener mayúscula, minúscula y número'),
    
    body('confirmPassword')
        .notEmpty().withMessage('Debe confirmar la contraseña')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    manejarErroresValidacion
];

// =====================================================
// 📊 VALIDADORES PARA REPORTES
// =====================================================

const validarFechas = [
    query('desde')
        .optional()
        .isISO8601().withMessage('Fecha "desde" inválida (debe ser ISO8601)'),
    
    query('hasta')
        .optional()
        .isISO8601().withMessage('Fecha "hasta" inválida (debe ser ISO8601)'),
    
    manejarErroresValidacion
];

module.exports = {
    validarRegistro,
    validarLogin,
    validarProducto,
    validarActualizacionProducto,
    validarCategoria,
    validarMovimiento,
    validarIdProducto,
    validarIdUsuario,
    validarIdCategoria,
    validarRecuperarPassword,
    validarResetPassword,
    validarFechas,
    manejarErroresValidacion
};
