// =====================================================
// 🔒 VALIDADORES DE FECHAS Y RANGOS
// =====================================================

// Valida que una fecha sea válida y no sea futura
const validarFecha = (fechaString, permitirFutura = false) => {
    if (!fechaString || typeof fechaString !== 'string') return false;
    
    const fecha = new Date(fechaString);
    
    // Verificar que sea una fecha válida
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return false;
    
    // Si no se permite fecha futura, validar que no sea futura
    if (!permitirFutura && fecha > new Date()) return false;
    
    return true;
};

// Valida que dos fechas formen un rango válido (inicio < fin)
const validarRangoFechas = (fechaInicio, fechaFin) => {
    if (!validarFecha(fechaInicio) || !validarFecha(fechaFin)) return false;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    // Fecha inicio debe ser antes que fin
    return inicio < fin;
};

// Valida email con regex RFC simplificado
const validarEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
};

module.exports = { 
    validarFecha, 
    validarRangoFechas,
    validarEmail 
};
