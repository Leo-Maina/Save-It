// ============================================================
// Budget Controller
// ============================================================
const { pool } = require('../config/db');
const { suggestBudgetAllocations } = require('../utils/budgetSuggestions');
const { evaluateBudgetAlerts } = require('../utils/alertService');

// GET /api/budgets
async function getBudgets(req, res) {
    try {
        const [budgets] = await pool.query(
            `SELECT id, name, type, start_date, end_date, amount, created_at
             FROM budgets WHERE user_id = ? ORDER BY start_date DESC`,
            [req.user.id]
        );
        return res.json({ budgets });
    } catch (err) {
        console.error('Get budgets error:', err);
        return res.status(500).json({ message: 'Could not fetch budgets.' });
    }
}

// GET /api/budgets/:id  (full detail: allocations + spend comparison)
async function getBudgetDetail(req, res) {
    try {
        const { id } = req.params;

        const [budgets] = await pool.query(
            `SELECT id, name, type, start_date, end_date, amount FROM budgets WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (budgets.length === 0) return res.status(404).json({ message: 'Budget not found.' });
        const budget = budgets[0];

        const [allocations] = await pool.query(
            `SELECT ba.id, ba.category_id, c.name AS category_name, ba.allocated_amount, ba.allocated_percent
             FROM budget_allocations ba JOIN categories c ON c.id = ba.category_id
             WHERE ba.budget_id = ?`,
            [id]
        );

        // For each allocation, compute actual spend in that category within the budget's date range
        const allocationsWithSpend = await Promise.all(allocations.map(async (alloc) => {
            const [spentRows] = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses
                 WHERE user_id = ? AND category_id = ? AND date BETWEEN ? AND ?`,
                [req.user.id, alloc.category_id, budget.start_date, budget.end_date]
            );
            const spent = Number(spentRows[0].spent);
            const allocated = Number(alloc.allocated_amount);
            return {
                ...alloc,
                spent,
                remaining: Math.round((allocated - spent) * 100) / 100,
                percentUsed: allocated > 0 ? Math.round((spent / allocated) * 1000) / 10 : 0
            };
        }));

        const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
        const totalSpent = allocationsWithSpend.reduce((sum, a) => sum + a.spent, 0);

        return res.json({
            budget: {
                ...budget,
                totalAllocated,
                totalSpent,
                remaining: Math.round((budget.amount - totalSpent) * 100) / 100,
                percentUsed: budget.amount > 0 ? Math.round((totalSpent / budget.amount) * 1000) / 10 : 0
            },
            allocations: allocationsWithSpend
        });
    } catch (err) {
        console.error('Get budget detail error:', err);
        return res.status(500).json({ message: 'Could not fetch budget detail.' });
    }
}

// POST /api/budgets/suggest  { totalIncome }
// Returns suggested allocations WITHOUT saving anything — preview only.
async function suggestBudget(req, res) {
    try {
        const { totalIncome } = req.body;
        if (!totalIncome || isNaN(totalIncome)) {
            return res.status(400).json({ message: 'totalIncome is required and must be a number.' });
        }
        const suggestions = suggestBudgetAllocations(totalIncome);
        return res.json({ suggestions });
    } catch (err) {
        console.error('Suggest budget error:', err);
        return res.status(500).json({ message: 'Could not generate budget suggestions.' });
    }
}

// POST /api/budgets
// body: { name, type, startDate, endDate, amount, allocations: [{categoryId, allocatedAmount, allocatedPercent}] }
async function createBudget(req, res) {
    const conn = await pool.getConnection();
    try {
        const { name, type, startDate, endDate, amount, allocations } = req.body;

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO budgets (user_id, name, type, start_date, end_date, amount)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, type || 'monthly', startDate, endDate, amount]
        );
        const budgetId = result.insertId;

        if (Array.isArray(allocations)) {
            for (const alloc of allocations) {
                await conn.query(
                    `INSERT INTO budget_allocations (budget_id, category_id, allocated_amount, allocated_percent)
                     VALUES (?, ?, ?, ?)`,
                    [budgetId, alloc.categoryId, alloc.allocatedAmount, alloc.allocatedPercent || null]
                );
            }
        }

        await conn.commit();

        return res.status(201).json({ message: 'Budget created.', budgetId });
    } catch (err) {
        await conn.rollback();
        console.error('Create budget error:', err);
        return res.status(500).json({ message: 'Could not create budget.' });
    } finally {
        conn.release();
    }
}

// PUT /api/budgets/:id
async function updateBudget(req, res) {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { name, type, startDate, endDate, amount, allocations } = req.body;

        const [existing] = await pool.query('SELECT id FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Budget not found.' });

        await conn.beginTransaction();

        await conn.query(
            `UPDATE budgets SET
                name = COALESCE(?, name), type = COALESCE(?, type),
                start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date),
                amount = COALESCE(?, amount)
             WHERE id = ? AND user_id = ?`,
            [name, type, startDate, endDate, amount, id, req.user.id]
        );

        if (Array.isArray(allocations)) {
            await conn.query('DELETE FROM budget_allocations WHERE budget_id = ?', [id]);
            for (const alloc of allocations) {
                await conn.query(
                    `INSERT INTO budget_allocations (budget_id, category_id, allocated_amount, allocated_percent)
                     VALUES (?, ?, ?, ?)`,
                    [id, alloc.categoryId, alloc.allocatedAmount, alloc.allocatedPercent || null]
                );
            }
        }

        await conn.commit();

        evaluateBudgetAlerts(req.user.id, id).catch(e => console.error('Alert eval error:', e));

        return res.json({ message: 'Budget updated.' });
    } catch (err) {
        await conn.rollback();
        console.error('Update budget error:', err);
        return res.status(500).json({ message: 'Could not update budget.' });
    } finally {
        conn.release();
    }
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Budget not found.' });
        return res.json({ message: 'Budget deleted.' });
    } catch (err) {
        console.error('Delete budget error:', err);
        return res.status(500).json({ message: 'Could not delete budget.' });
    }
}

module.exports = {
    getBudgets,
    getBudgetDetail,
    suggestBudget,
    createBudget,
    updateBudget,
    deleteBudget
};
