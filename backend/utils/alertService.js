// ============================================================
// Alert Service — shared business logic for generating alerts.
// Called by expense/income/budget/savings/recurring controllers
// whenever a relevant change happens, rather than running on a
// fixed schedule only.
// ============================================================
const { pool } = require('../config/db');

const BUDGET_WARNING_THRESHOLD = 0.8; // 80% used triggers a warning
const BUDGET_CRITICAL_THRESHOLD = 1.0; // 100%+ triggers an overspend alert

async function createAlert(userId, type, message, relatedId = null) {
    // Avoid duplicate unread alerts with the exact same message for the same user
    const [existing] = await pool.query(
        `SELECT id FROM alerts WHERE user_id = ? AND message = ? AND status = 'unread' LIMIT 1`,
        [userId, message]
    );
    if (existing.length > 0) return; // already alerted, don't spam

    await pool.query(
        `INSERT INTO alerts (user_id, type, message, related_id) VALUES (?, ?, ?, ?)`,
        [userId, type, message, relatedId]
    );
}

/**
 * Evaluates a specific budget's category allocations against actual spend
 * and creates alerts for any category crossing the warning/critical thresholds.
 */
async function evaluateBudgetAlerts(userId, budgetId) {
    const [budgets] = await pool.query(
        `SELECT id, name, start_date, end_date FROM budgets WHERE id = ? AND user_id = ?`,
        [budgetId, userId]
    );
    if (budgets.length === 0) return;
    const budget = budgets[0];

    const [allocations] = await pool.query(
        `SELECT ba.category_id, ba.allocated_amount, c.name AS category_name
         FROM budget_allocations ba
         JOIN categories c ON c.id = ba.category_id
         WHERE ba.budget_id = ?`,
        [budgetId]
    );

    for (const alloc of allocations) {
        const [spentRows] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS spent
             FROM expenses
             WHERE user_id = ? AND category_id = ? AND date BETWEEN ? AND ?`,
            [userId, alloc.category_id, budget.start_date, budget.end_date]
        );
        const spent = Number(spentRows[0].spent);
        const allocated = Number(alloc.allocated_amount);
        if (allocated <= 0) continue;

        const ratio = spent / allocated;

        if (ratio >= BUDGET_CRITICAL_THRESHOLD) {
            await createAlert(
                userId,
                'budget',
                `You have exceeded your ${alloc.category_name} budget for "${budget.name}" (spent KSh ${spent.toLocaleString()} of KSh ${allocated.toLocaleString()}).`,
                budgetId
            );
        } else if (ratio >= BUDGET_WARNING_THRESHOLD) {
            const pct = Math.round(ratio * 100);
            await createAlert(
                userId,
                'budget',
                `You have used ${pct}% of your ${alloc.category_name} budget for "${budget.name}".`,
                budgetId
            );
        }
    }
}

/**
 * Evaluates all active budgets that include the given date within their range.
 * Useful right after an expense is logged.
 */
async function evaluateBudgetAlertsForDate(userId, date) {
    const [budgets] = await pool.query(
        `SELECT id FROM budgets WHERE user_id = ? AND ? BETWEEN start_date AND end_date`,
        [userId, date]
    );
    for (const b of budgets) {
        await evaluateBudgetAlerts(userId, b.id);
    }
}

/**
 * Checks a savings goal's pace against time elapsed vs deadline,
 * flagging if the saver is meaningfully behind a linear pace.
 */
async function evaluateSavingsAlert(userId, goalId) {
    const [goals] = await pool.query(
        `SELECT id, name, target_amount, current_amount, deadline, status, created_at
         FROM savings_goals WHERE id = ? AND user_id = ?`,
        [goalId, userId]
    );
    if (goals.length === 0) return;
    const goal = goals[0];
    if (goal.status !== 'active' || !goal.deadline) return;

    const now = new Date();
    const start = new Date(goal.created_at);
    const deadline = new Date(goal.deadline);

    const totalDuration = deadline - start;
    const elapsed = now - start;
    if (totalDuration <= 0 || elapsed <= 0) return;

    const expectedProgress = Math.min(elapsed / totalDuration, 1);
    const actualProgress = Number(goal.current_amount) / Number(goal.target_amount);

    // Behind by more than 15 percentage points of expected linear pace
    if (actualProgress < expectedProgress - 0.15) {
        await createAlert(
            userId,
            'savings',
            `You are behind your savings target for "${goal.name}". You've saved ${Math.round(actualProgress * 100)}% but should be around ${Math.round(expectedProgress * 100)}% by now.`,
            goalId
        );
    }

    if (actualProgress >= 1 && goal.status === 'active') {
        await pool.query(`UPDATE savings_goals SET status = 'completed' WHERE id = ?`, [goalId]);
        await createAlert(userId, 'savings', `Congratulations! You've reached your "${goal.name}" savings goal.`, goalId);
    }
}

/**
 * Compares this week's spending to last week's and alerts on significant increases.
 */
async function evaluateExpenseTrendAlert(userId) {
    const [rows] = await pool.query(
        `SELECT
            COALESCE(SUM(CASE WHEN date >= CURDATE() - INTERVAL 7 DAY THEN amount ELSE 0 END), 0) AS this_week,
            COALESCE(SUM(CASE WHEN date >= CURDATE() - INTERVAL 14 DAY AND date < CURDATE() - INTERVAL 7 DAY THEN amount ELSE 0 END), 0) AS last_week
         FROM expenses WHERE user_id = ?`,
        [userId]
    );

    const thisWeek = Number(rows[0].this_week);
    const lastWeek = Number(rows[0].last_week);

    if (lastWeek > 0 && thisWeek > lastWeek * 1.3) {
        const pctIncrease = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        await createAlert(
            userId,
            'expense',
            `Your spending increased by ${pctIncrease}% this week compared to last week.`
        );
    }
}

/**
 * Flags recurring expenses due within the next 2 days.
 */
async function evaluateRecurringDueAlerts(userId) {
    const [rows] = await pool.query(
        `SELECT id, name, amount, next_due_date FROM recurring_expenses
         WHERE user_id = ? AND is_active = TRUE AND next_due_date BETWEEN CURDATE() AND CURDATE() + INTERVAL 2 DAY`,
        [userId]
    );
    for (const r of rows) {
        await createAlert(
            userId,
            'recurring',
            `${r.name} payment of KSh ${Number(r.amount).toLocaleString()} is due on ${r.next_due_date.toISOString ? r.next_due_date.toISOString().split('T')[0] : r.next_due_date}.`,
            r.id
        );
    }
}

module.exports = {
    createAlert,
    evaluateBudgetAlerts,
    evaluateBudgetAlertsForDate,
    evaluateSavingsAlert,
    evaluateExpenseTrendAlert,
    evaluateRecurringDueAlerts
};
