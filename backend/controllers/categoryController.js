// ============================================================
// Categories Controller
// ============================================================
const { pool } = require('../config/db');

// GET /api/categories?type=expense|income
async function getCategories(req, res) {
    try {
        const { type } = req.query;
        let query = 'SELECT id, name, type, icon, is_default FROM categories';
        const params = [];
        if (type) { query += ' WHERE type = ?'; params.push(type); }
        query += ' ORDER BY type, name';

        const [rows] = await pool.query(query, params);
        return res.json({ categories: rows });
    } catch (err) {
        console.error('Get categories error:', err);
        return res.status(500).json({ message: 'Could not fetch categories.' });
    }
}

// POST /api/categories  (admin only)
async function addCategory(req, res) {
    try {
        const { name, type, icon } = req.body;

        const [existing] = await pool.query('SELECT id FROM categories WHERE name = ? AND type = ?', [name, type]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'A category with this name and type already exists.' });
        }

        const [result] = await pool.query(
            'INSERT INTO categories (name, type, icon, is_default) VALUES (?, ?, ?, FALSE)',
            [name, type, icon || null]
        );

        return res.status(201).json({ message: 'Category added.', categoryId: result.insertId });
    } catch (err) {
        console.error('Add category error:', err);
        return res.status(500).json({ message: 'Could not add category.' });
    }
}

// PUT /api/categories/:id  (admin only)
async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name, icon } = req.body;

        const [result] = await pool.query(
            'UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon) WHERE id = ?',
            [name, icon, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found.' });

        return res.json({ message: 'Category updated.' });
    } catch (err) {
        console.error('Update category error:', err);
        return res.status(500).json({ message: 'Could not update category.' });
    }
}

// DELETE /api/categories/:id  (admin only)
async function deleteCategory(req, res) {
    try {
        const { id } = req.params;

        const [category] = await pool.query('SELECT is_default FROM categories WHERE id = ?', [id]);
        if (category.length === 0) return res.status(404).json({ message: 'Category not found.' });
        if (category[0].is_default) {
            return res.status(400).json({ message: 'Default system categories cannot be deleted.' });
        }

        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        return res.json({ message: 'Category deleted.' });
    } catch (err) {
        console.error('Delete category error:', err);
        // Likely an FK constraint violation if transactions reference this category
        return res.status(409).json({ message: 'Could not delete category. It may be in use by existing transactions.' });
    }
}

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };
