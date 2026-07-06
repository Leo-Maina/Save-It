// ============================================================
// Income Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const incomeController = require('../controllers/incomeController');

router.use(protect);

const incomeValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
    body('categoryId').isInt().withMessage('A valid category is required.'),
    body('date').isISO8601().withMessage('A valid date is required.'),
    handleValidation
];

router.get('/', incomeController.getIncome);
router.post('/', incomeValidation, incomeController.addIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
