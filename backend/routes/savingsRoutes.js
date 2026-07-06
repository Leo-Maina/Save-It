// ============================================================
// Savings Goals Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const savingsController = require('../controllers/savingsController');

router.use(protect);

router.get('/', savingsController.getGoals);
router.get('/:id', savingsController.getGoalDetail);
router.post('/', savingsController.createGoal);
router.put('/:id', savingsController.updateGoal);
router.delete('/:id', savingsController.deleteGoal);
router.post('/:id/contribute', savingsController.addContribution);

module.exports = router;
