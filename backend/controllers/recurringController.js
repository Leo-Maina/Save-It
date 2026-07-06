// ============================================================
// Recurring Expenses Controller
// ============================================================
const { pool } = require('../config/db');

function addInterval(dateStr, frequency) {
    const date = new Date(dateStr);
    switch (frequency) {
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'monthly': date.setMonth(date.getMonth() + 1); break;
        case 'termly': date.setMonth(date.getMonth() + 4); break; // approx one semester
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
        default: date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
}

// GET /api/recurring
async function getRecurring(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT r.id, r.name, r.amount, r.category_id, c.name AS category_name,
                    r.frequency, r.start_date, r.end_date, r.next_due_date, r.is_active
             FROM recurring_expenses r JOIN categories c ON c.id = r.category_id
             WHERE r.user_id = ? ORDER BY r.next_due_date ASC`,
            [req.user.id]
        );
        return res.json({ recurring: rows });
    } catch (err) {
        console.error('Get recurring error:', err);
        return res.status(500).json({ message: 'Could not fetch recurring expenses.' });
    }
}

// POST /api/recurring
async function addRecurring(req, res) {
    try {
        const { name, amount, categoryId, frequency, startDate, endDate } = req.body;
        const nextDueDate = startDate;

        const [result] = await pool.query(
            `INSERT INTO recurring_expenses (user_id, name, amount, category_id, frequency, start_date, end_date, next_due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, amount, categoryId, frequency || 'monthly', startDate, endDate || null, nextDueDate]
        );

        return res.status(201).json({ message: 'Recurring expense added.', recurringId: result.insertId });
    } catch (err) {
        console.error('Add recurring error:', err);
        return res.status(500).json({ message: 'Could not add recurring expense.' });
    }
}

// PUT /api/recurring/:id
async function updateRecurring(req, res) {
    try {
        const { id } = req.params;
        const { name, amount, categoryId, frequency, startDate, endDate, isActive } = req.body;

        const [existing] = await pool.query('SELECT id FROM recurring_expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Recurring expense not found.' });

        await pool.query(
            `UPDATE recurring_expenses SET
                name = COALESCE(?, name), amount = COALESCE(?, amount),
                category_id = COALESCE(?, category_id), frequency = COALESCE(?, frequency),
                start_date = COALESCE(?, start_date), end_date = ?, is_active = COALESCE(?, is_active)
             WHERE id = ? AND user_id = ?`,
            [name, amount, categoryId, frequency, startDate, endDate ?? null, isActive, id, req.user.id]
        );

        return res.json({ message: 'Recurring expense updated.' });
    } catch (err) {
        console.error('Update recurring error:', err);
        return res.status(500).json({ message: 'Could not update recurring expense.' });
    }
}

// DELETE /api/recurring/:id
async function deleteRecurring(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Recurring expense not found.' });
        return res.json({ message: 'Recurring expense deleted.' });
    } catch (err) {
        console.error('Delete recurring error:', err);
        return res.status(500).json({ message: 'Could not delete recurring expense.' });
    }
}

// POST /api/recurring/:id/log-payment
// Logs an actual expense for this recurring item and advances next_due_date.
async function logPayment(req, res) {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const [rows] = await conn.query('SELECT * FROM recurring_expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Recurring expense not found.' });
        const recurring = rows[0];

        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO expenses (user_id, amount, category_id, date, description, payment_method)
             VALUES (?, ?, ?, CURDATE(), ?, 'other')`,
            [req.user.id, recurring.amount, recurring.category_id, `${recurring.name} (recurring payment)`]
        );

        const nextDue = addInterval(new Date().toISOString().split('T')[0], recurring.frequency);
        await conn.query('UPDATE recurring_expenses SET next_due_date = ? WHERE id = ?', [nextDue, id]);

        await conn.commit();

        return res.json({ message: 'Payment logged.', nextDueDate: nextDue });
    } catch (err) {
        await conn.rollback();
        console.error('Log payment error:', err);
        return res.status(500).json({ message: 'Could not log payment.' });
    } finally {
        conn.release();
    }
}

module.exports = { getRecurring, addRecurring, updateRecurring, deleteRecurring, logPayment };
