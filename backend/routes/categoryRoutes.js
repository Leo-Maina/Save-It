// ============================================================
// Category Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

router.use(protect);

router.get('/', categoryController.getCategories);
router.post('/', requireRole('admin'), categoryController.addCategory);
router.put('/:id', requireRole('admin'), categoryController.updateCategory);
router.delete('/:id', requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
