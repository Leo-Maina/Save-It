// ============================================================
// Dashboard & Reports Controller
// ============================================================
const { pool } = require('../config/db');

// GET /api/dashboard
// Returns the data needed for the main student dashboard:
// summary cards, spending-by-category pie data, active budget overview,
// savings overview, and recent transactions.
async function getDashboard(req, res) {
    try {
        const userId = req.user.id;

        const [[incomeTotals]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_income FROM income WHERE user_id = ?`,
            [userId]
        );
        const [[expenseTotals]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE user_id = ?`,
            [userId]
        );

        const totalIncome = Number(incomeTotals.total_income);
        const totalExpenses = Number(expenseTotals.total_expenses);
        const balance = Math.round((totalIncome - totalExpenses) * 100) / 100;

        const [[savingsTotals]] = await pool.query(
            `SELECT COALESCE(SUM(target_amount), 0) AS total_target, COALESCE(SUM(current_amount), 0) AS total_saved
             FROM savings_goals WHERE user_id = ? AND status = 'active'`,
            [userId]
        );
        const savingsProgress = Number(savingsTotals.total_target) > 0
            ? Math.round((Number(savingsTotals.total_saved) / Number(savingsTotals.total_target)) * 1000) / 10
            : 0;

        // Spending distribution by category (pie chart)
        const [pieData] = await pool.query(
            `SELECT c.name AS category, COALESCE(SUM(e.amount), 0) AS total
             FROM categories c
             LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = ?
             WHERE c.type = 'expense'
             GROUP BY c.id, c.name
             HAVING total > 0
             ORDER BY total DESC`,
            [userId]
        );

        // Current active budget overview (most recent budget covering today)
        const [activeBudgets] = await pool.query(
            `SELECT id, name, amount, start_date, end_date FROM budgets
             WHERE user_id = ? AND CURDATE() BETWEEN start_date AND end_date
             ORDER BY start_date DESC LIMIT 1`,
            [userId]
        );

        let budgetOverview = null;
        if (activeBudgets.length > 0) {
            const budget = activeBudgets[0];
            const [[spentRow]] = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses
                 WHERE user_id = ? AND date BETWEEN ? AND ?`,
                [userId, budget.start_date, budget.end_date]
            );
            const spent = Number(spentRow.spent);
            budgetOverview = {
                id: budget.id,
                name: budget.name,
                amount: Number(budget.amount),
                spent,
                remaining: Math.round((Number(budget.amount) - spent) * 100) / 100,
                percentUsed: Number(budget.amount) > 0 ? Math.round((spent / Number(budget.amount)) * 1000) / 10 : 0
            };
        }

        // Savings overview (active goals)
        const [savingsGoals] = await pool.query(
            `SELECT id, name, target_amount, current_amount, deadline FROM savings_goals
             WHERE user_id = ? AND status = 'active' ORDER BY deadline ASC LIMIT 5`,
            [userId]
        );
        const savingsOverview = savingsGoals.map(g => ({
            id: g.id,
            name: g.name,
            target: Number(g.target_amount),
            current: Number(g.current_amount),
            deadline: g.deadline,
            percentComplete: Number(g.target_amount) > 0
                ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 1000) / 10
                : 0
        }));

        // Recent transactions (last 5 income + 5 expenses, merged)
        const [recentIncome] = await pool.query(
            `SELECT i.id, 'income' AS type, i.amount, i.date, i.description, c.name AS category
             FROM income i JOIN categories c ON c.id = i.category_id
             WHERE i.user_id = ? ORDER BY i.date DESC, i.id DESC LIMIT 5`,
            [userId]
        );
        const [recentExpenses] = await pool.query(
            `SELECT e.id, 'expense' AS type, e.amount, e.date, e.description, c.name AS category
             FROM expenses e JOIN categories c ON c.id = e.category_id
             WHERE e.user_id = ? ORDER BY e.date DESC, e.id DESC LIMIT 5`,
            [userId]
        );
        const recentTransactions = [...recentIncome, ...recentExpenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);

        return res.json({
            summary: {
                totalIncome,
                totalExpenses,
                balance,
                savingsProgress
            },
            spendingByCategory: pieData.map(r => ({ category: r.category, total: Number(r.total) })),
            budgetOverview,
            savingsOverview,
            recentTransactions
        });
    } catch (err) {
        console.error('Get dashboard error:', err);
        return res.status(500).json({ message: 'Could not load dashboard.' });
    }
}

// GET /api/reports/monthly?month=2026-06
async function getMonthlyReport(req, res) {
    try {
        const userId = req.user.id;
        const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
        const startDate = `${month}-01`;

        const [[incomeRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM income
             WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
            [userId, month]
        );
        const [[expenseRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
             WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
            [userId, month]
        );
        const [byCategory] = await pool.query(
            `SELECT c.name AS category, COALESCE(SUM(e.amount), 0) AS total
             FROM expenses e JOIN categories c ON c.id = e.category_id
             WHERE e.user_id = ? AND DATE_FORMAT(e.date, '%Y-%m') = ?
             GROUP BY c.id, c.name ORDER BY total DESC`,
            [userId, month]
        );

        return res.json({
            month,
            totalIncome: Number(incomeRow.total),
            totalExpenses: Number(expenseRow.total),
            netSavings: Math.round((Number(incomeRow.total) - Number(expenseRow.total)) * 100) / 100,
            spendingByCategory: byCategory.map(r => ({ category: r.category, total: Number(r.total) }))
        });
    } catch (err) {
        console.error('Get monthly report error:', err);
        return res.status(500).json({ message: 'Could not generate monthly report.' });
    }
}

// GET /api/reports/semester?startDate=2026-01-01&endDate=2026-04-30
async function getSemesterReport(req, res) {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required.' });
        }

        const [[incomeRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND date BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );
        const [[expenseRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );
        const [byCategory] = await pool.query(
            `SELECT c.name AS category, COALESCE(SUM(e.amount), 0) AS total
             FROM expenses e JOIN categories c ON c.id = e.category_id
             WHERE e.user_id = ? AND e.date BETWEEN ? AND ?
             GROUP BY c.id, c.name ORDER BY total DESC`,
            [userId, startDate, endDate]
        );
        // Monthly breakdown within the range, useful for a trend chart
        const [monthlyBreakdown] = await pool.query(
            `SELECT DATE_FORMAT(date, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS total
             FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?
             GROUP BY month ORDER BY month ASC`,
            [userId, startDate, endDate]
        );

        return res.json({
            startDate,
            endDate,
            totalIncome: Number(incomeRow.total),
            totalExpenses: Number(expenseRow.total),
            netSavings: Math.round((Number(incomeRow.total) - Number(expenseRow.total)) * 100) / 100,
            spendingByCategory: byCategory.map(r => ({ category: r.category, total: Number(r.total) })),
            monthlyBreakdown: monthlyBreakdown.map(r => ({ month: r.month, total: Number(r.total) }))
        });
    } catch (err) {
        console.error('Get semester report error:', err);
        return res.status(500).json({ message: 'Could not generate semester report.' });
    }
}

// GET /api/reports/savings-performance
async function getSavingsPerformance(req, res) {
    try {
        const userId = req.user.id;
        const [goals] = await pool.query(
            `SELECT id, name, target_amount, current_amount, deadline, status, created_at
             FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        const performance = goals.map(g => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            return {
                id: g.id,
                name: g.name,
                target,
                current,
                status: g.status,
                deadline: g.deadline,
                percentComplete: target > 0 ? Math.round((current / target) * 1000) / 10 : 0
            };
        });

        return res.json({ goals: performance });
    } catch (err) {
        console.error('Get savings performance error:', err);
        return res.status(500).json({ message: 'Could not generate savings performance report.' });
    }
}

module.exports = { getDashboard, getMonthlyReport, getSemesterReport, getSavingsPerformance };
