// ============================================================
// Budget Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

router.use(protect);

router.get('/', budgetController.getBudgets);
router.post('/suggest', budgetController.suggestBudget);
router.get('/:id', budgetController.getBudgetDetail);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
