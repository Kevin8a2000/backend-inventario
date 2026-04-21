const validarProducto = (req, res, next) => {
    const { nombre, precio } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    if (!precio || precio <= 0) {
        return res.status(400).json({ mensaje: "El precio debe ser mayor a 0" });
    }

    next(); // pasa al controller
};

module.exports = validarProducto;