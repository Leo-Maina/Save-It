// ============================================================
// Admin Controller
// ============================================================
const { pool } = require('../config/db');

// GET /api/admin/users
async function getUsers(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, email, phone, university, student_id, course, year_of_study,
                    role, is_verified, is_active, created_at
             FROM users WHERE role = 'student' ORDER BY created_at DESC`
        );
        return res.json({ users: rows });
    } catch (err) {
        console.error('Get users error:', err);
        return res.status(500).json({ message: 'Could not fetch users.' });
    }
}

// PUT /api/admin/users/:id/disable
async function disableUser(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`UPDATE users SET is_active = FALSE WHERE id = ? AND role = 'student'`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
        return res.json({ message: 'User account disabled.' });
    } catch (err) {
        console.error('Disable user error:', err);
        return res.status(500).json({ message: 'Could not disable user.' });
    }
}

// PUT /api/admin/users/:id/enable
async function enableUser(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`UPDATE users SET is_active = TRUE WHERE id = ? AND role = 'student'`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
        return res.json({ message: 'User account enabled.' });
    } catch (err) {
        console.error('Enable user error:', err);
        return res.status(500).json({ message: 'Could not enable user.' });
    }
}

// GET /api/admin/stats
async function getStats(req, res) {
    try {
        const [[userStats]] = await pool.query(
            `SELECT COUNT(*) AS total_users,
                    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_users,
                    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) AS verified_users
             FROM users WHERE role = 'student'`
        );

        const [[incomeCount]] = await pool.query('SELECT COUNT(*) AS count FROM income');
        const [[expenseCount]] = await pool.query('SELECT COUNT(*) AS count FROM expenses');
        const [[budgetCount]] = await pool.query('SELECT COUNT(*) AS count FROM budgets');
        const [[goalCount]] = await pool.query('SELECT COUNT(*) AS count FROM savings_goals');

        // "Active users" in the activity sense: users with a transaction in the last 30 days
        const [[recentlyActive]] = await pool.query(
            `SELECT COUNT(DISTINCT user_id) AS count FROM (
                SELECT user_id FROM income WHERE created_at >= NOW() - INTERVAL 30 DAY
                UNION
                SELECT user_id FROM expenses WHERE created_at >= NOW() - INTERVAL 30 DAY
             ) AS active`
        );

        return res.json({
            totalUsers: Number(userStats.total_users),
            activeAccounts: Number(userStats.active_users),
            verifiedUsers: Number(userStats.verified_users),
            recentlyActiveUsers: Number(recentlyActive.count),
            totalTransactions: Number(incomeCount.count) + Number(expenseCount.count),
            totalIncomeRecords: Number(incomeCount.count),
            totalExpenseRecords: Number(expenseCount.count),
            totalBudgets: Number(budgetCount.count),
            totalSavingsGoals: Number(goalCount.count)
        });
    } catch (err) {
        console.error('Get stats error:', err);
        return res.status(500).json({ message: 'Could not fetch system statistics.' });
    }
}

// GET /api/admin/activity  (recent signups + recent transactions, for system monitoring)
async function getActivity(req, res) {
    try {
        const [recentSignups] = await pool.query(
            `SELECT id, name, email, created_at FROM users WHERE role = 'student'
             ORDER BY created_at DESC LIMIT 10`
        );

        const [recentTransactions] = await pool.query(
            `(SELECT 'income' AS type, i.id, i.amount, i.date, u.name AS user_name, i.created_at
              FROM income i JOIN users u ON u.id = i.user_id ORDER BY i.created_at DESC LIMIT 10)
             UNION ALL
             (SELECT 'expense' AS type, e.id, e.amount, e.date, u.name AS user_name, e.created_at
              FROM expenses e JOIN users u ON u.id = e.user_id ORDER BY e.created_at DESC LIMIT 10)
             ORDER BY created_at DESC LIMIT 15`
        );

        return res.json({ recentSignups, recentTransactions });
    } catch (err) {
        console.error('Get activity error:', err);
        return res.status(500).json({ message: 'Could not fetch system activity.' });
    }
}

module.exports = { getUsers, disableUser, enableUser, getStats, getActivity };
