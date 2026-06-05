const logger = {
    info: (mensaje, datos = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[INFO] ${mensaje}`, datos);
        }
    },
    
    error: (mensaje, error = {}) => {
        const errorSafe = {
            message: error.message,
            code: error.code
        };
        console.error(`[ERROR] ${mensaje}`, errorSafe);
    },
    
    debug: (mensaje, datos = {}) => {
        if (process.env.NODE_ENV === 'development') {
            // Enmascarar campos sensibles antes de loguear
            const safe = JSON.parse(JSON.stringify(datos));
            if (safe.password) safe.password = '***';
            if (safe.token) safe.token = '***';
            if (safe.email) safe.email = '***@***.com';
            console.log(`[DEBUG] ${mensaje}`, safe);
        }
    }
};

module.exports = logger;