// ============================================================
// Alerts Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const alertController = require('../controllers/alertController');

router.use(protect);

router.get('/', alertController.getAlerts);
router.post('/refresh', alertController.refreshAlerts);
router.put('/:id/read', alertController.markAsRead);
router.put('/:id/dismiss', alertController.dismissAlert);

module.exports = router;
