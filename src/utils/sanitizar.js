// =====================================================
// 🔒 UTILS - SANITIZACIÓN DE DATOS
// =====================================================

// Escapa caracteres HTML peligrosos de un string (Previene XSS)
const escaparHTML = (texto) => {
    if (typeof texto !== 'string') return texto;
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
};

// Limpia un objeto recursivamente - Sanitiza todos los strings
const sanitizarObjeto = (obj) => {
    if (typeof obj === 'string') return escaparHTML(obj.trim());
    if (Array.isArray(obj)) return obj.map(sanitizarObjeto);
    if (obj && typeof obj === 'object') {
        const limpio = {};
        for (const key of Object.keys(obj)) {
            limpio[key] = sanitizarObjeto(obj[key]);
        }
        return limpio;
    }
    return obj;
};

// Elimina scripts y código malicioso
const limpiarScripts = (texto) => {
    if (typeof texto !== 'string') return texto;
    return texto
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
};

// Sanitiza URLs para prevenir inyecciones
const sanitizarURL = (url) => {
    if (typeof url !== 'string') return '';
    try {
        const urlObj = new URL(url);
        // Solo permite protocolos seguros
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return '';
        }
        return urlObj.toString();
    } catch {
        return '';
    }
};

// Valida y sanitiza direcciones de email
const sanitizarEmail = (email) => {
    if (typeof email !== 'string') return '';
    const emailLimpio = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailLimpio) ? emailLimpio : '';
};

// Limita la longitud de un string de forma segura
const limitarLongitud = (texto, maximo) => {
    if (typeof texto !== 'string') return '';
    return texto.substring(0, maximo).trim();
};

module.exports = { 
    escaparHTML, 
    sanitizarObjeto, 
    limpiarScripts,
    sanitizarURL,
    sanitizarEmail,
    limitarLongitud
};
