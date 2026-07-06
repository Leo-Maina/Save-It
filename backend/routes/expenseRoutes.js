// ============================================================
// Expense Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const expenseController = require('../controllers/expenseController');

router.use(protect);

const expenseValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
    body('categoryId').isInt().withMessage('A valid category is required.'),
    body('date').isISO8601().withMessage('A valid date is required.'),
    body('paymentMethod').optional().isIn(['cash', 'mpesa', 'card', 'bank', 'other']),
    handleValidation
];

router.get('/', expenseController.getExpenses);
router.post('/', expenseValidation, expenseController.addExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
