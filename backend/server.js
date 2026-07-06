// ============================================================
// Save-It Backend — Server Entry Point
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const { testConnection, pool } = require('./config/db');
const { evaluateRecurringDueAlerts, evaluateExpenseTrendAlert } = require('./utils/alertService');

const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ------------------------------------------------------------
// Global middleware
// ------------------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
});

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'save-it-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', dashboardRoutes); // exposes /api/dashboard and /api/reports/*

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

// Global error handler (catches anything thrown synchronously in handlers)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'An unexpected error occurred.' });
});

// ------------------------------------------------------------
// Scheduled jobs
// Runs daily at 07:00 server time to surface recurring-payment
// and spending-trend alerts for ALL active students, so alerts
// don't only appear right after a relevant action.
// ------------------------------------------------------------
function scheduleDailyAlertSweep() {
    cron.schedule('0 7 * * *', async () => {
        console.log('⏰ Running daily alert sweep...');
        try {
            const [users] = await pool.query(`SELECT id FROM users WHERE role = 'student' AND is_active = TRUE`);
            for (const u of users) {
                await evaluateRecurringDueAlerts(u.id);
                await evaluateExpenseTrendAlert(u.id);
            }
            console.log(`✅ Daily alert sweep complete for ${users.length} users.`);
        } catch (err) {
            console.error('Daily alert sweep failed:', err);
        }
    });
}

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
const PORT = process.env.PORT || 5000;

(async () => {
    const connected = await testConnection();
    if (!connected) {
        console.error('Server starting without a verified DB connection. Check your .env settings.');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Save-It backend running on http://localhost:${PORT}`);
        scheduleDailyAlertSweep();
    });
})();

module.exports = app;
