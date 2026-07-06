-- ============================================================
-- SAVE-IT: Sample / Seed Data
-- Run AFTER schema.sql
-- Usage:  mysql -u root -p save_it_db < seed.sql
-- ============================================================
USE save_it_db;

-- ------------------------------------------------------------
-- DEFAULT CATEGORIES
-- ------------------------------------------------------------
INSERT INTO categories (name, type, icon, is_default) VALUES
-- Expense categories
('Food', 'expense', 'utensils', TRUE),
('Transport', 'expense', 'bus', TRUE),
('Accommodation', 'expense', 'home', TRUE),
('Academic', 'expense', 'book', TRUE),
('Miscellaneous', 'expense', 'shopping-bag', TRUE),
-- Income categories
('Allowance', 'income', 'wallet', TRUE),
('Part-time earnings', 'income', 'briefcase', TRUE),
('Bursary', 'income', 'graduation-cap', TRUE),
('Other income', 'income', 'plus-circle', TRUE);

-- ------------------------------------------------------------
-- USERS
-- Password for ALL seeded accounts is: Password123!
-- (bcrypt hash below was generated with 10 salt rounds)
-- ------------------------------------------------------------
INSERT INTO users
    (name, email, password, phone, university, student_id, course, year_of_study, role, is_verified, is_active)
VALUES
    ('Admin User', 'admin@saveit.app', '$2a$10$5bnAcIXk2ZY7thIRWHeDJe0nhFqjqVeTUWJUV7MIf/sBQj281rgPO', '0700000000',
     'Strathmore University', NULL, NULL, NULL, 'admin', TRUE, TRUE),

    ('Leonel Maina', 'leonel.maina@strathmore.edu', '$2a$10$5bnAcIXk2ZY7thIRWHeDJe0nhFqjqVeTUWJUV7MIf/sBQj281rgPO', '0711223344',
     'Strathmore University', '192227', 'Informatics and Computer Science', 4, 'student', TRUE, TRUE),

    ('Sandra Mutai', 'sandra.mutai@strathmore.edu', '$2a$10$5bnAcIXk2ZY7thIRWHeDJe0nhFqjqVeTUWJUV7MIf/sBQj281rgPO', '0722334455',
     'Strathmore University', '190381', 'Informatics and Computer Science', 4, 'student', TRUE, TRUE);

-- ------------------------------------------------------------
-- SAMPLE INCOME for Leonel (user_id = 2)
-- ------------------------------------------------------------
INSERT INTO income (user_id, amount, category_id, date, description) VALUES
(2, 15000.00, (SELECT id FROM categories WHERE name='Allowance' AND type='income'), '2026-06-01', 'June allowance from parents'),
(2, 8000.00,  (SELECT id FROM categories WHERE name='Part-time earnings' AND type='income'), '2026-06-05', 'Freelance web design gig'),
(2, 5000.00,  (SELECT id FROM categories WHERE name='Bursary' AND type='income'), '2026-06-10', 'HELB bursary disbursement');

-- ------------------------------------------------------------
-- SAMPLE EXPENSES for Leonel (user_id = 2)
-- ------------------------------------------------------------
INSERT INTO expenses (user_id, amount, category_id, date, description, payment_method) VALUES
(2, 350.00,  (SELECT id FROM categories WHERE name='Food' AND type='expense'), '2026-06-02', 'Lunch at cafeteria', 'cash'),
(2, 1200.00, (SELECT id FROM categories WHERE name='Food' AND type='expense'), '2026-06-03', 'Weekly groceries', 'mpesa'),
(2, 100.00,  (SELECT id FROM categories WHERE name='Transport' AND type='expense'), '2026-06-03', 'Matatu fare to campus', 'cash'),
(2, 6000.00, (SELECT id FROM categories WHERE name='Accommodation' AND type='expense'), '2026-06-01', 'June rent', 'mpesa'),
(2, 1500.00, (SELECT id FROM categories WHERE name='Academic' AND type='expense'), '2026-06-04', 'Printing and stationery', 'cash'),
(2, 800.00,  (SELECT id FROM categories WHERE name='Miscellaneous' AND type='expense'), '2026-06-06', 'Laundry and toiletries', 'mpesa'),
(2, 450.00,  (SELECT id FROM categories WHERE name='Food' AND type='expense'), '2026-06-08', 'Dinner with friends', 'cash');

-- ------------------------------------------------------------
-- SAMPLE BUDGET for Leonel: "June Budget" (monthly)
-- ------------------------------------------------------------
INSERT INTO budgets (user_id, name, type, start_date, end_date, amount) VALUES
(2, 'June Budget', 'monthly', '2026-06-01', '2026-06-30', 28000.00);

SET @budget_id = LAST_INSERT_ID();

INSERT INTO budget_allocations (budget_id, category_id, allocated_amount, allocated_percent) VALUES
(@budget_id, (SELECT id FROM categories WHERE name='Food' AND type='expense'),          8400.00, 30.00),
(@budget_id, (SELECT id FROM categories WHERE name='Transport' AND type='expense'),     4200.00, 15.00),
(@budget_id, (SELECT id FROM categories WHERE name='Accommodation' AND type='expense'), 6000.00, 21.43),
(@budget_id, (SELECT id FROM categories WHERE name='Academic' AND type='expense'),      5600.00, 20.00),
(@budget_id, (SELECT id FROM categories WHERE name='Miscellaneous' AND type='expense'), 3800.00, 13.57);

-- ------------------------------------------------------------
-- SAMPLE SAVINGS GOAL for Leonel: "Laptop"
-- ------------------------------------------------------------
INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline, status) VALUES
(2, 'Laptop', 80000.00, 18000.00, '2026-12-01', 'active');

SET @goal_id = LAST_INSERT_ID();

INSERT INTO savings_contributions (savings_goal_id, amount, date, note) VALUES
(@goal_id, 10000.00, '2026-04-15', 'Initial deposit'),
(@goal_id, 5000.00,  '2026-05-15', 'May savings'),
(@goal_id, 3000.00,  '2026-06-10', 'June savings');

-- ------------------------------------------------------------
-- SAMPLE RECURRING EXPENSE for Leonel: "Rent"
-- ------------------------------------------------------------
INSERT INTO recurring_expenses (user_id, name, amount, category_id, frequency, start_date, next_due_date, is_active) VALUES
(2, 'Rent', 6000.00, (SELECT id FROM categories WHERE name='Accommodation' AND type='expense'), 'monthly', '2026-01-01', '2026-07-01', TRUE),
(2, 'Internet subscription', 1500.00, (SELECT id FROM categories WHERE name='Miscellaneous' AND type='expense'), 'monthly', '2026-01-01', '2026-07-01', TRUE);

-- ------------------------------------------------------------
-- SAMPLE ALERTS for Leonel
-- ------------------------------------------------------------
INSERT INTO alerts (user_id, type, message, status) VALUES
(2, 'budget', 'You have used 75% of your Accommodation budget for June Budget.', 'unread'),
(2, 'savings', 'You are behind your savings target for "Laptop". Consider increasing contributions.', 'unread'),
(2, 'recurring', 'Rent payment of KSh 6,000.00 is due on 2026-07-01.', 'unread');

-- ============================================================
-- End of seed data
-- ============================================================
