// ============================================================
// Recurring Expenses Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recurringController = require('../controllers/recurringController');

router.use(protect);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.addRecurring);
router.put('/:id', recurringController.updateRecurring);
router.delete('/:id', recurringController.deleteRecurring);
router.post('/:id/log-payment', recurringController.logPayment);

module.exports = router;
