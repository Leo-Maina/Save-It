// ============================================================
// Dashboard & Reports Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protect);

router.get('/dashboard', dashboardController.getDashboard);
router.get('/reports/monthly', dashboardController.getMonthlyReport);
router.get('/reports/semester', dashboardController.getSemesterReport);
router.get('/reports/savings-performance', dashboardController.getSavingsPerformance);

module.exports = router;
