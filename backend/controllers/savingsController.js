// ============================================================
// Savings Goals Controller
// ============================================================
const { pool } = require('../config/db');
const { evaluateSavingsAlert } = require('../utils/alertService');

function withProgress(goal) {
    const target = Number(goal.target_amount);
    const current = Number(goal.current_amount);
    return {
        ...goal,
        percentComplete: target > 0 ? Math.min(100, Math.round((current / target) * 1000) / 10) : 0,
        remaining: Math.max(0, Math.round((target - current) * 100) / 100)
    };
}

// GET /api/savings
async function getGoals(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, target_amount, current_amount, deadline, status, created_at
             FROM savings_goals WHERE user_id = ? ORDER BY status ASC, deadline ASC`,
            [req.user.id]
        );
        return res.json({ goals: rows.map(withProgress) });
    } catch (err) {
        console.error('Get goals error:', err);
        return res.status(500).json({ message: 'Could not fetch savings goals.' });
    }
}

// GET /api/savings/:id  (includes contribution history)
async function getGoalDetail(req, res) {
    try {
        const { id } = req.params;
        const [goals] = await pool.query(
            `SELECT id, name, target_amount, current_amount, deadline, status, created_at
             FROM savings_goals WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (goals.length === 0) return res.status(404).json({ message: 'Savings goal not found.' });

        const [contributions] = await pool.query(
            `SELECT id, amount, date, note FROM savings_contributions
             WHERE savings_goal_id = ? ORDER BY date DESC`,
            [id]
        );

        return res.json({ goal: withProgress(goals[0]), contributions });
    } catch (err) {
        console.error('Get goal detail error:', err);
        return res.status(500).json({ message: 'Could not fetch savings goal.' });
    }
}

// POST /api/savings
async function createGoal(req, res) {
    try {
        const { name, targetAmount, deadline, initialAmount } = req.body;

        const [result] = await pool.query(
            `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, name, targetAmount, initialAmount || 0, deadline || null]
        );

        return res.status(201).json({ message: 'Savings goal created.', goalId: result.insertId });
    } catch (err) {
        console.error('Create goal error:', err);
        return res.status(500).json({ message: 'Could not create savings goal.' });
    }
}

// PUT /api/savings/:id
async function updateGoal(req, res) {
    try {
        const { id } = req.params;
        const { name, targetAmount, deadline, status } = req.body;

        const [existing] = await pool.query('SELECT id FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Savings goal not found.' });

        await pool.query(
            `UPDATE savings_goals SET
                name = COALESCE(?, name), target_amount = COALESCE(?, target_amount),
                deadline = COALESCE(?, deadline), status = COALESCE(?, status)
             WHERE id = ? AND user_id = ?`,
            [name, targetAmount, deadline, status, id, req.user.id]
        );

        return res.json({ message: 'Savings goal updated.' });
    } catch (err) {
        console.error('Update goal error:', err);
        return res.status(500).json({ message: 'Could not update savings goal.' });
    }
}

// DELETE /api/savings/:id
async function deleteGoal(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Savings goal not found.' });
        return res.json({ message: 'Savings goal deleted.' });
    } catch (err) {
        console.error('Delete goal error:', err);
        return res.status(500).json({ message: 'Could not delete savings goal.' });
    }
}

// POST /api/savings/:id/contribute   { amount, date, note }
async function addContribution(req, res) {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { amount, date, note } = req.body;

        const [existing] = await conn.query('SELECT id, current_amount FROM savings_goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Savings goal not found.' });

        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO savings_contributions (savings_goal_id, amount, date, note) VALUES (?, ?, ?, ?)`,
            [id, amount, date || new Date().toISOString().split('T')[0], note || null]
        );

        await conn.query(
            `UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ?`,
            [amount, id]
        );

        await conn.commit();

        evaluateSavingsAlert(req.user.id, id).catch(e => console.error('Alert eval error:', e));

        const [updated] = await pool.query(
            `SELECT id, name, target_amount, current_amount, deadline, status FROM savings_goals WHERE id = ?`,
            [id]
        );

        return res.status(201).json({ message: 'Contribution added.', goal: withProgress(updated[0]) });
    } catch (err) {
        await conn.rollback();
        console.error('Add contribution error:', err);
        return res.status(500).json({ message: 'Could not add contribution.' });
    } finally {
        conn.release();
    }
}

module.exports = { getGoals, getGoalDetail, createGoal, updateGoal, deleteGoal, addContribution };
