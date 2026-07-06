// ============================================================
// Auth Controller
// ============================================================
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../utils/email');
const { OAuth2Client } = require('google-auth-library');

const SALT_ROUNDS = 10;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ------------------------------------------------------------
// POST /api/auth/register
// ------------------------------------------------------------
async function register(req, res) {
    const { name, email, password, phone, university, studentId, course, yearOfStudy } = req.body;

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const [result] = await pool.query(
            `INSERT INTO users
                (name, email, password, phone, university, student_id, course, year_of_study, role, is_verified, verification_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'student', FALSE, ?)`,
            [name, email, hashedPassword, phone || null, university || null, studentId || null, course || null, yearOfStudy || null, verificationToken]
        );

        const { verifyUrl } = await sendVerificationEmail(email, name, verificationToken);

        const [newUserRows] = await pool.query(
            'SELECT id, name, email, role, is_verified FROM users WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Registration successful. Please verify your email to activate your account.',
            user: newUserRows[0],
            // Included only because email sending is stubbed in this build —
            // in production this would NOT be returned to the client.
            devVerificationLink: verifyUrl
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Something went wrong during registration.' });
    }
}

// ------------------------------------------------------------
// GET /api/auth/verify-email?token=...
// ------------------------------------------------------------
async function verifyEmail(req, res) {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required.' });

    try {
        const [rows] = await pool.query('SELECT id FROM users WHERE verification_token = ?', [token]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
            [rows[0].id]
        );

        return res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(500).json({ message: 'Something went wrong while verifying your email.' });
    }
}

// ------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------
async function login(req, res) {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(403).json({ message: 'This account has been disabled. Contact support.' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        const { password: _pw, verification_token: _vt, ...safeUser } = user;

        return res.json({ message: 'Login successful.', token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Something went wrong during login.' });
    }
}

// ------------------------------------------------------------
// POST /api/auth/google
// ------------------------------------------------------------
async function googleAuth(req, res) {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Google credential is required.' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if (!payload.email_verified) {
            return res.status(400).json({ message: 'Google account email is not verified.' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [payload.email]);
        let user = rows[0];

        if (!user) {
            const [result] = await pool.query(
                `INSERT INTO users
                    (name, email, password, role, is_verified, auth_provider)
                 VALUES (?, ?, NULL, 'student', TRUE, 'google')`,
                [payload.name, payload.email]
            );

            const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUserRows[0];
        } else if (!user.is_active) {
            return res.status(403).json({ message: 'This account has been disabled. Contact support.' });
        }

        const token = generateToken(user);
        const { password: _pw, verification_token: _vt, ...safeUser } = user;

        return res.json({ message: 'Login successful.', token, user: safeUser });
    } catch (err) {
        console.error('Google auth error:', err);
        return res.status(401).json({ message: 'Google authentication failed.' });
    }
}

// ------------------------------------------------------------
// GET /api/auth/me
// ------------------------------------------------------------
async function getProfile(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, email, phone, university, student_id, course, year_of_study,
                    role, is_verified, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        return res.json({ user: rows[0] });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ message: 'Could not fetch profile.' });
    }
}

// ------------------------------------------------------------
// PUT /api/auth/me
// ------------------------------------------------------------
async function updateProfile(req, res) {
    const { name, phone, university, studentId, course, yearOfStudy } = req.body;

    try {
        await pool.query(
            `UPDATE users SET
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                university = COALESCE(?, university),
                student_id = COALESCE(?, student_id),
                course = COALESCE(?, course),
                year_of_study = COALESCE(?, year_of_study)
             WHERE id = ?`,
            [name, phone, university, studentId, course, yearOfStudy, req.user.id]
        );

        const [rows] = await pool.query(
            `SELECT id, name, email, phone, university, student_id, course, year_of_study, role
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        return res.json({ message: 'Profile updated.', user: rows[0] });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Could not update profile.' });
    }
}

// ------------------------------------------------------------
// PUT /api/auth/change-password
// ------------------------------------------------------------
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });

        const matches = await bcrypt.compare(currentPassword, rows[0].password);
        if (!matches) return res.status(401).json({ message: 'Current password is incorrect.' });

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

        return res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ message: 'Could not change password.' });
    }
}

module.exports = {
    register,
    verifyEmail,
    login,
    googleAuth,
    getProfile,
    updateProfile,
    changePassword
};