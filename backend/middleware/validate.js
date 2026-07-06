// ============================================================
// Validation error handler — used after express-validator chains
// ============================================================
const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed.',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
}

module.exports = { handleValidation };
