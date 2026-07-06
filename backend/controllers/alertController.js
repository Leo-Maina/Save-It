// ============================================================
// Alerts Controller
// ============================================================
const { pool } = require('../config/db');
const { evaluateRecurringDueAlerts, evaluateExpenseTrendAlert } = require('../utils/alertService');

// GET /api/alerts
async function getAlerts(req, res) {
    try {
        const { status } = req.query;
        let query = `SELECT id, type, message, status, related_id, created_at FROM alerts WHERE user_id = ?`;
        const params = [req.user.id];
        if (status) { query += ' AND status = ?'; params.push(status); }
        query += ' ORDER BY created_at DESC LIMIT 100';

        const [rows] = await pool.query(query, params);
        return res.json({ alerts: rows });
    } catch (err) {
        console.error('Get alerts error:', err);
        return res.status(500).json({ message: 'Could not fetch alerts.' });
    }
}

// PUT /api/alerts/:id/read
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            `UPDATE alerts SET status = 'read' WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Alert not found.' });
        return res.json({ message: 'Alert marked as read.' });
    } catch (err) {
        console.error('Mark alert read error:', err);
        return res.status(500).json({ message: 'Could not update alert.' });
    }
}

// PUT /api/alerts/:id/dismiss
async function dismissAlert(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            `UPDATE alerts SET status = 'dismissed' WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Alert not found.' });
        return res.json({ message: 'Alert dismissed.' });
    } catch (err) {
        console.error('Dismiss alert error:', err);
        return res.status(500).json({ message: 'Could not update alert.' });
    }
}

// POST /api/alerts/refresh
// On-demand trigger to re-evaluate recurring/expense-trend alerts
// (budget + savings alerts are evaluated automatically on relevant writes).
async function refreshAlerts(req, res) {
    try {
        await evaluateRecurringDueAlerts(req.user.id);
        await evaluateExpenseTrendAlert(req.user.id);
        return res.json({ message: 'Alerts refreshed.' });
    } catch (err) {
        console.error('Refresh alerts error:', err);
        return res.status(500).json({ message: 'Could not refresh alerts.' });
    }
}

module.exports = { getAlerts, markAsRead, dismissAlert, refreshAlerts };
