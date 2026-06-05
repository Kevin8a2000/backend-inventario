const mongoose = require('mongoose');

const validarObjectId = (req, res, next) => {
    const id = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            ok: false,
            error: "El ID proporcionado no tiene un formato válido para MongoDB"
        });
    }
    
    next();
};

module.exports = validarObjectId;