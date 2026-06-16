const Usuario = require("../models/Usuario");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const { escaparHTML } = require("../utils/sanitizar");

const { enviarCorreo, enviarCorreoCambioEmail, enviarCorreoAlertaStock } = require("../utils/email");

const crypto = require("crypto");

// =====================================================
// 🔐 REGISTRO
// =====================================================

const register = async (req, res) => {

    try {

        const {

            nombre,
            apellido,
            email,
            password,
            confirmPassword

        } = req.body;

        // =====================================================
        // ✅ VALIDAR CAMPOS
        // =====================================================

        if (

            !nombre ||
            !apellido ||
            !email ||
            !password ||
            !confirmPassword

        ) {

            return res.status(400).json({

                ok: false,

                error:
                    "Todos los campos son obligatorios"
            });
        }

        // =====================================================
        // ✅ VALIDAR PASSWORDS
        // =====================================================

        if (password !== confirmPassword) {

            return res.status(400).json({

                ok: false,

                error:
                    "Las contraseñas no coinciden"
            });
        }

        // =====================================================
        // ✅ VALIDAR CONTRASEÑA FUERTE
        // =====================================================
        // Mínimo 12 caracteres, al menos 1 mayúscula, 1 número, 1 carácter especial

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{12,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                ok: false,
                error: "La contraseña debe tener mínimo 12 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*)"
            });
        }

        // =====================================================
        // ✅ VALIDAR TIPOS DE DATOS
        // =====================================================

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                ok: false,
                error: "Datos inválidos"
            });
        }

        // =====================================================
        // ✅ VALIDAR EMAIL (RFC COMPLIANT)
        // =====================================================

        const emailLimpio = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(emailLimpio)) {
            return res.status(400).json({
                ok: false,
                error: "El email no es válido"
            });
        }
        const existe = await Usuario.findOne({

            email: emailLimpio
        });

        if (existe) {

            return res.status(400).json({

                ok: false,

                error:
                    "El email ya está registrado"
            });
        }

        // =====================================================
        // 🔐 ENCRIPTAR PASSWORD
        // =====================================================

        const hash =
            await bcrypt.hash(password, 10);

        // =====================================================
        // � SANITIZAR NOMBRE Y APELLIDO (XSS Prevention)
        // =====================================================

        const nombreLimpio = escaparHTML(nombre.trim());
        const apellidoLimpio = escaparHTML(apellido.trim());

        // =====================================================
        // 🔥 CREAR USUARIO
        // =====================================================

        const usuario = new Usuario({

            nombre: nombreLimpio,

            apellido: apellidoLimpio,

            email: emailLimpio,

            password: hash,

            rol: "usuario",

            permisos: [],

            notificaciones: {

                stockBajo: true,

                stockAgotado: true,

                movimientoGrande: true
            }
        });

        await usuario.save();

        // =====================================================
        // 🔥 GENERAR TOKEN
        // =====================================================

        const token = jwt.sign(

            {

                id: usuario._id,

                rol: usuario.rol,

                permisos:
                    usuario.permisos || []
            },

            process.env.JWT_SECRET,

            {

                expiresIn: "7d"
            }
        );

        // =====================================================
        // ✅ RESPUESTA FINAL
        // =====================================================

        res.status(201).json({

            ok: true,

            mensaje:
                "Usuario registrado correctamente",

            token,

            usuario: {

                id: usuario._id,

                nombre: usuario.nombre,

                apellido: usuario.apellido,

                email: usuario.email,

                rol: usuario.rol,

                permisos:
                    usuario.permisos || [],

                notificaciones:
                    usuario.notificaciones
            }
        });

    } catch (error) {

        // Solo loguear en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.error("📝 Register Error:", error.message);
        }

        res.status(500).json({

            ok: false,

            error:
                "Error en registro"
        });
    }
};

// =====================================================
// 🔐 LOGIN
// =====================================================

const login = async (req, res) => {

    try {

        const {

            email,
            password

        } = req.body;

        // =====================================================
        // ✅ VALIDAR CAMPOS
        // =====================================================

        if (!email || !password) {

            return res.status(400).json({

                ok: false,

                error:
                    "Email y contraseña son obligatorios"
            });
        }

        // =====================================================
        // ✅ VALIDAR TIPOS DE DATOS
        // =====================================================

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                ok: false,
                error: "Datos inválidos"
            });
        }

        // =====================================================
        // 🔍 BUSCAR USUARIO
        // =====================================================

        const emailLimpio = email.trim().toLowerCase();
        const usuario =
            await Usuario.findOne({

                email: emailLimpio
            });

        if (!usuario) {

            return res.status(400).json({

                ok: false,

                error:
                    "Usuario no existe"
            });
        }

        // =====================================================
        // 🔐 VALIDAR PASSWORD
        // =====================================================

        const valido =
            await bcrypt.compare(

                password,

                usuario.password
            );

        if (!valido) {

            return res.status(400).json({

                ok: false,

                error:
                    "Contraseña incorrecta"
            });
        }

        // =====================================================
        // 🔥 GENERAR TOKEN JWT
        // =====================================================

        const token = jwt.sign(

            {

                id: usuario._id,

                rol: usuario.rol,

                permisos:
                    usuario.permisos || []
            },

            process.env.JWT_SECRET,

            {

                expiresIn: "7d"
            }
        );

        // =====================================================
        // ✅ RESPUESTA FINAL
        // =====================================================

        res.json({

            ok: true,

            mensaje:
                "Login exitoso",

            token,

            usuario: {

                id: usuario._id,

                nombre: usuario.nombre,

                apellido: usuario.apellido,

                email: usuario.email,

                rol: usuario.rol,

                permisos:
                    usuario.permisos || [],

                notificaciones:
                    usuario.notificaciones,

                preferencias: {
                    email:    usuario.preferencias?.email    ?? true,
                    reportes: usuario.preferencias?.reportes ?? true,
                }
            }
        });

    } catch (error) {

        // Solo loguear en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.error("🔐 Login Error:", error.message);
        }

        res.status(500).json({

            ok: false,

            error:
                "Error en login"
        });
    }
};

// =====================================================
// 🔐 RECUPERAR PASSWORD
// =====================================================

const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const emailLimpio = email?.trim().toLowerCase();

        // 🔍 BUSCAR USUARIO
        const usuario = await Usuario.findOne({ email: emailLimpio });

        if (!usuario) {
            // No revelar si el usuario existe por seguridad
            return res.json({
                ok: true,
                mensaje: "Email enviado"
            });
        }

        // 🔐 GENERAR TOKEN
        const token = crypto.randomBytes(20).toString("hex");
        usuario.resetPasswordToken = token;
        usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await usuario.save();

        // 🔗 LINK FRONTEND
        const link = `https://invenstock-la-costa.vercel.app/reset-password/${token}`;

        // 📧 ENVIAR CORREO
        await enviarCorreo(
            usuario.email,
            "🔐 Recuperación de contraseña",
            `Hola ${usuario.nombre}

Haz clic en el siguiente enlace para recuperar tu contraseña:

${link}

⚠️ Este enlace expirará en 1 hora.

Si no solicitaste esta recuperación, ignora este correo.`
        );

        res.json({
            ok: true,
            mensaje: "Email enviado"
        });

    } catch (error) {
        console.error("🔐 Recuperar Password Error:", error.message);

        res.status(500).json({
            ok: false,
            error: "Error al enviar correo de recuperación"
        });
    }
};

// =====================================================
// 🔐 RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        // ✅ VALIDAR PASSWORDS
        if (password !== confirmPassword) {
            return res.status(400).json({
                ok: false,
                error: "Las contraseñas no coinciden"
            });
        }

        // ✅ VALIDAR FORTALEZA DE CONTRASEÑA
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{12,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                ok: false,
                error: "La contraseña debe tener mínimo 12 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*)"
            });
        }

        // 🔍 BUSCAR USUARIO
        const usuario = await Usuario.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                error: "Usuario no encontrado"
            });
        }

        // 🔒 ENCRIPTAR PASSWORD
        const hash = await bcrypt.hash(password, 10);
        usuario.password = hash;

        // 🗑️ LIMPIAR TOKEN
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;

        // 💾 GUARDAR
        await usuario.save();

        res.json({
            ok: true,
            mensaje: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("🔐 Reset Password Error:", error.message);
        }

        res.status(500).json({
            ok: false,
            error: "Error al actualizar contraseña"
        });
    }
};

// =====================================================
// 🔑 CAMBIO DE CONTRASEÑA
// =====================================================

const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                ok: false,
                error: "Ambos campos son requeridos"
            });
        }

        if (typeof passwordActual !== "string" || typeof passwordNueva !== "string") {
            return res.status(400).json({ ok: false, error: "Datos inválidos" });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{12,}$/;
        if (!passwordRegex.test(passwordNueva)) {
            return res.status(400).json({
                ok: false,
                error: "La contraseña debe tener mínimo 12 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*)"
            });
        }

        const usuario = await Usuario.findById(req.usuario.id).select("+password");
        if (!usuario) {
            return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
        }

        const esValida = await bcrypt.compare(passwordActual, usuario.password);
        if (!esValida) {
            return res.status(400).json({
                ok: false,
                error: "Contraseña actual incorrecta"
            });
        }

        usuario.password = await bcrypt.hash(passwordNueva, 10);
        await usuario.save();

        res.json({
            ok: true,
            mensaje: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("🔑 Change Password Error:", error.message);
        }

        res.status(500).json({
            ok: false,
            error: "Error al actualizar la contraseña"
        });
    }
};

// =====================================================
// 📧 CAMBIO DE EMAIL
// =====================================================

const changeEmail = async (req, res) => {
    try {
        const { emailNuevo, emailAnterior } = req.body;

        if (!emailNuevo || !emailAnterior) {
            return res.status(400).json({
                ok: false,
                error: "emailNuevo y emailAnterior son requeridos"
            });
        }

        if (typeof emailNuevo !== "string" || typeof emailAnterior !== "string") {
            return res.status(400).json({ ok: false, error: "Datos inválidos" });
        }

        const emailNuevoLimpio = emailNuevo.trim().toLowerCase();
        const emailAnteriorLimpio = emailAnterior.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailNuevoLimpio)) {
            return res.status(400).json({
                ok: false,
                error: "El formato del nuevo correo no es válido"
            });
        }

        const yaExiste = await Usuario.findOne({ email: emailNuevoLimpio });
        if (yaExiste && String(yaExiste._id) !== String(req.usuario.id)) {
            return res.status(400).json({
                ok: false,
                error: "Ese correo ya está registrado por otro usuario"
            });
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id,
            { $set: { email: emailNuevoLimpio } },
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
        }

        await enviarCorreoCambioEmail(
            emailAnteriorLimpio,
            usuario.nombre,
            emailNuevoLimpio
        );

        res.json({
            ok: true,
            mensaje: "Correo actualizado y notificación enviada"
        });

    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("📧 Change Email Error:", error.message);
        }

        res.status(500).json({
            ok: false,
            error: "Error al actualizar el correo"
        });
    }
};

// =====================================================
// ⚙️ OBTENER PREFERENCIAS DE NOTIFICACIÓN
// =====================================================

const obtenerPreferencias = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select("preferencias");

        if (!usuario) {
            return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
        }

        res.json({
            email:    usuario.preferencias?.email    ?? true,
            reportes: usuario.preferencias?.reportes ?? true,
        });

    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("⚙️ Obtener Preferencias Error:", error.message);
        }
        res.status(500).json({ ok: false, error: "Error al obtener preferencias" });
    }
};

// =====================================================
// ⚙️ GUARDAR PREFERENCIAS DE NOTIFICACIÓN
// =====================================================

const guardarPreferencias = async (req, res) => {
    try {
        const { email, reportes } = req.body;

        if (typeof email !== "boolean" || typeof reportes !== "boolean") {
            return res.status(400).json({
                ok: false,
                error: "email y reportes deben ser booleanos"
            });
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id,
            { $set: { "preferencias.email": email, "preferencias.reportes": reportes } },
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
        }

        res.json({ ok: true, mensaje: "Preferencias guardadas" });

    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("⚙️ Preferencias Error:", error.message);
        }
        res.status(500).json({ ok: false, error: "Error al guardar preferencias" });
    }
};

module.exports = {
    register,
    login,
    recuperarPassword,
    resetPassword,
    changePassword,
    changeEmail,
    obtenerPreferencias,
    guardarPreferencias
};