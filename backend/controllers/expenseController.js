// ============================================================
// Expense Controller
// ============================================================
const { pool } = require('../config/db');
const { evaluateBudgetAlertsForDate, evaluateExpenseTrendAlert } = require('../utils/alertService');

// GET /api/expenses  (supports search, date range, category filters)
async function getExpenses(req, res) {
    try {
        const { startDate, endDate, categoryId, search } = req.query;
        let query = `
            SELECT e.id, e.amount, e.date, e.description, e.category_id, e.payment_method,
                   e.receipt_image, c.name AS category_name, e.created_at
            FROM expenses e
            JOIN categories c ON c.id = e.category_id
            WHERE e.user_id = ?`;
        const params = [req.user.id];

        if (startDate) { query += ' AND e.date >= ?'; params.push(startDate); }
        if (endDate) { query += ' AND e.date <= ?'; params.push(endDate); }
        if (categoryId) { query += ' AND e.category_id = ?'; params.push(categoryId); }
        if (search) { query += ' AND e.description LIKE ?'; params.push(`%${search}%`); }

        query += ' ORDER BY e.date DESC, e.id DESC';

        const [rows] = await pool.query(query, params);
        return res.json({ expenses: rows });
    } catch (err) {
        console.error('Get expenses error:', err);
        return res.status(500).json({ message: 'Could not fetch expense records.' });
    }
}

// POST /api/expenses
async function addExpense(req, res) {
    try {
        const { amount, categoryId, date, description, paymentMethod, receiptImage } = req.body;

        const [result] = await pool.query(
            `INSERT INTO expenses (user_id, amount, category_id, date, description, payment_method, receipt_image)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, amount, categoryId, date, description || null, paymentMethod || 'cash', receiptImage || null]
        );

        const [rows] = await pool.query(
            `SELECT e.id, e.amount, e.date, e.description, e.category_id, e.payment_method, c.name AS category_name
             FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = ?`,
            [result.insertId]
        );

        // Fire-and-forget alert evaluation (don't block the response on this)
        evaluateBudgetAlertsForDate(req.user.id, date).catch(e => console.error('Alert eval error:', e));
        evaluateExpenseTrendAlert(req.user.id).catch(e => console.error('Alert eval error:', e));

        return res.status(201).json({ message: 'Expense added.', expense: rows[0] });
    } catch (err) {
        console.error('Add expense error:', err);
        return res.status(500).json({ message: 'Could not add expense.' });
    }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
    try {
        const { id } = req.params;
        const { amount, categoryId, date, description, paymentMethod, receiptImage } = req.body;

        const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Expense not found.' });

        await pool.query(
            `UPDATE expenses SET
                amount = COALESCE(?, amount),
                category_id = COALESCE(?, category_id),
                date = COALESCE(?, date),
                description = ?,
                payment_method = COALESCE(?, payment_method),
                receipt_image = ?
             WHERE id = ? AND user_id = ?`,
            [amount, categoryId, date, description ?? null, paymentMethod, receiptImage ?? null, id, req.user.id]
        );

        const [rows] = await pool.query(
            `SELECT e.id, e.amount, e.date, e.description, e.category_id, e.payment_method, c.name AS category_name
             FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = ?`,
            [id]
        );

        if (date) {
            evaluateBudgetAlertsForDate(req.user.id, date).catch(e => console.error('Alert eval error:', e));
        }

        return res.json({ message: 'Expense updated.', expense: rows[0] });
    } catch (err) {
        console.error('Update expense error:', err);
        return res.status(500).json({ message: 'Could not update expense.' });
    }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Expense not found.' });
        return res.json({ message: 'Expense deleted.' });
    } catch (err) {
        console.error('Delete expense error:', err);
        return res.status(500).json({ message: 'Could not delete expense.' });
    }
}

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
