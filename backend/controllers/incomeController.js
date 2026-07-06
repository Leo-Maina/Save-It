// ============================================================
// Income Controller
// ============================================================
const { pool } = require('../config/db');

// GET /api/income
async function getIncome(req, res) {
    try {
        const { startDate, endDate, categoryId } = req.query;
        let query = `
            SELECT i.id, i.amount, i.date, i.description, i.category_id,
                   c.name AS category_name, i.created_at
            FROM income i
            JOIN categories c ON c.id = i.category_id
            WHERE i.user_id = ?`;
        const params = [req.user.id];

        if (startDate) { query += ' AND i.date >= ?'; params.push(startDate); }
        if (endDate) { query += ' AND i.date <= ?'; params.push(endDate); }
        if (categoryId) { query += ' AND i.category_id = ?'; params.push(categoryId); }

        query += ' ORDER BY i.date DESC, i.id DESC';

        const [rows] = await pool.query(query, params);
        return res.json({ income: rows });
    } catch (err) {
        console.error('Get income error:', err);
        return res.status(500).json({ message: 'Could not fetch income records.' });
    }
}

// POST /api/income
async function addIncome(req, res) {
    try {
        const { amount, categoryId, date, description } = req.body;

        const [result] = await pool.query(
            `INSERT INTO income (user_id, amount, category_id, date, description)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, amount, categoryId, date, description || null]
        );

        const [rows] = await pool.query(
            `SELECT i.id, i.amount, i.date, i.description, i.category_id, c.name AS category_name
             FROM income i JOIN categories c ON c.id = i.category_id WHERE i.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({ message: 'Income added.', income: rows[0] });
    } catch (err) {
        console.error('Add income error:', err);
        return res.status(500).json({ message: 'Could not add income.' });
    }
}

// PUT /api/income/:id
async function updateIncome(req, res) {
    try {
        const { id } = req.params;
        const { amount, categoryId, date, description } = req.body;

        const [existing] = await pool.query('SELECT id FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Income record not found.' });

        await pool.query(
            `UPDATE income SET
                amount = COALESCE(?, amount),
                category_id = COALESCE(?, category_id),
                date = COALESCE(?, date),
                description = ?
             WHERE id = ? AND user_id = ?`,
            [amount, categoryId, date, description ?? null, id, req.user.id]
        );

        const [rows] = await pool.query(
            `SELECT i.id, i.amount, i.date, i.description, i.category_id, c.name AS category_name
             FROM income i JOIN categories c ON c.id = i.category_id WHERE i.id = ?`,
            [id]
        );

        return res.json({ message: 'Income updated.', income: rows[0] });
    } catch (err) {
        console.error('Update income error:', err);
        return res.status(500).json({ message: 'Could not update income.' });
    }
}

// DELETE /api/income/:id
async function deleteIncome(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Income record not found.' });
        return res.json({ message: 'Income deleted.' });
    } catch (err) {
        console.error('Delete income error:', err);
        return res.status(500).json({ message: 'Could not delete income.' });
    }
}

module.exports = { getIncome, addIncome, updateIncome, deleteIncome };
