// ============================================================
// Admin Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, requireRole('admin'));

router.get('/users', adminController.getUsers);
router.put('/users/:id/disable', adminController.disableUser);
router.put('/users/:id/enable', adminController.enableUser);
router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivity);

module.exports = router;
