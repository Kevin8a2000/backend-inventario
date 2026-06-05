const validarEnv = () => {
    const requeridas = [
        'MONGO_URI',
        'JWT_SECRET',
        'PORT'
    ];
    
    const faltantes = requeridas.filter(v => !process.env[v]);
    
    if (faltantes.length > 0) {
        console.error('❌ ERROR FATAL: Faltan variables de entorno críticas:');
        faltantes.forEach(v => {
            console.error(`  - ${v}`);
        });
        process.exit(1);
    }
    
    console.log('✅ Configuración de entorno validada correctamente');
};

module.exports = validarEnv;