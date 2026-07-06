// ============================================================
// Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/register', [
    body('name').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('phone').optional({ checkFalsy: true }).isString(),
    body('university').optional({ checkFalsy: true }).isString(),
    body('studentId').optional({ checkFalsy: true }).isString(),
    body('course').optional({ checkFalsy: true }).isString(),
    body('yearOfStudy').optional({ checkFalsy: true }).isInt({ min: 1, max: 8 }).withMessage('Year of study must be between 1 and 8.'),
    handleValidation
], authController.register);

router.get('/verify-email', authController.verifyEmail);

router.post('/login', [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    handleValidation
], authController.login);

// Stubbed — see authController.googleAuth
router.post('/google', authController.googleAuth);

router.get('/me', protect, authController.getProfile);

router.put('/me', protect, [
    body('yearOfStudy').optional({ checkFalsy: true }).isInt({ min: 1, max: 8 }),
    handleValidation
], authController.updateProfile);

router.put('/change-password', protect, [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
    handleValidation
], authController.changePassword);

module.exports = router;