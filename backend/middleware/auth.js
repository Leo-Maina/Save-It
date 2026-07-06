// ============================================================
// Authentication middleware
// ============================================================
const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');

async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        const [rows] = await pool.query(
            'SELECT id, name, email, role, is_active, is_verified FROM users WHERE id = ?',
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists.' });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(403).json({ message: 'This account has been disabled. Contact support.' });
        }

        req.user = user; // attach to request for downstream handlers
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
    }
}

// Restrict a route to specific roles, e.g. requireRole('admin')
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        next();
    };
}

module.exports = { protect, requireRole };
