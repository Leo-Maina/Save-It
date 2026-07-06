-- ============================================================
-- SAVE-IT: Student Budgeting Application
-- MySQL Database Schema
-- ============================================================
-- Run this file first to create the database and all tables.
-- Usage:  mysql -u root -p < schema.sql
-- ============================================================

DROP DATABASE IF EXISTS save_it_db;
CREATE DATABASE save_it_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE save_it_db;

-- ------------------------------------------------------------
-- USERS
-- Stores both students and administrators (role column distinguishes them)
-- ------------------------------------------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    password        VARCHAR(255)        NOT NULL,        -- bcrypt hash
    phone           VARCHAR(20)         NULL,
    university      VARCHAR(150)        NULL,
    student_id      VARCHAR(50)         NULL,
    course          VARCHAR(150)        NULL,
    year_of_study   TINYINT             NULL,
    role            ENUM('student','admin') NOT NULL DEFAULT 'student',
    auth_provider   ENUM('local','google') NOT NULL DEFAULT 'local',
    google_id       VARCHAR(255)        NULL,
    is_verified     BOOLEAN             NOT NULL DEFAULT FALSE,
    verification_token   VARCHAR(255)   NULL,
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CATEGORIES
-- Shared lookup table for both income and expense categories.
-- 'type' distinguishes income categories from expense categories.
-- is_default = TRUE means it's a system-seeded category (cannot be deleted by students).
-- ------------------------------------------------------------
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    type        ENUM('income','expense') NOT NULL,
    icon        VARCHAR(50)     NULL,          -- icon identifier for the UI
    is_default  BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_category_name_type (name, type)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- INCOME
-- ------------------------------------------------------------
CREATE TABLE income (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT             NOT NULL,
    amount      DECIMAL(12,2)   NOT NULL,
    category_id INT             NOT NULL,
    date        DATE            NOT NULL,
    description VARCHAR(255)    NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_income_user_date (user_id, date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- EXPENSES
-- ------------------------------------------------------------
CREATE TABLE expenses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    category_id     INT             NOT NULL,
    date            DATE            NOT NULL,
    description     VARCHAR(255)    NULL,
    payment_method  ENUM('cash','mpesa','card','bank','other') NOT NULL DEFAULT 'cash',
    receipt_image   VARCHAR(255)    NULL,       -- file path/URL to uploaded receipt
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_expenses_user_date (user_id, date),
    INDEX idx_expenses_user_category (user_id, category_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- BUDGETS
-- Supports monthly, semester, and custom date-range budgets.
-- ------------------------------------------------------------
CREATE TABLE budgets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT             NOT NULL,
    name        VARCHAR(150)    NOT NULL,          -- e.g. "March Budget", "Semester 1 2026"
    type        ENUM('monthly','semester','custom') NOT NULL DEFAULT 'monthly',
    start_date  DATE            NOT NULL,
    end_date    DATE            NOT NULL,
    amount      DECIMAL(12,2)   NOT NULL,          -- total budgeted income/amount
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_budgets_user (user_id),
    CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- BUDGET ALLOCATIONS
-- Per-category breakdown of a budget (e.g. Food: 30%, Transport: 15%).
-- This supports the "Automatic Budget Suggestions" feature and lets
-- the alert system evaluate spend-vs-allocation per category.
-- ------------------------------------------------------------
CREATE TABLE budget_allocations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    budget_id       INT             NOT NULL,
    category_id     INT             NOT NULL,
    allocated_amount DECIMAL(12,2)  NOT NULL,
    allocated_percent DECIMAL(5,2)  NULL,         -- stored for display/editing convenience
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    UNIQUE KEY uniq_budget_category (budget_id, category_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SAVINGS GOALS
-- ------------------------------------------------------------
CREATE TABLE savings_goals (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    name            VARCHAR(150)    NOT NULL,      -- e.g. "Laptop"
    target_amount   DECIMAL(12,2)   NOT NULL,
    current_amount  DECIMAL(12,2)   NOT NULL DEFAULT 0,
    deadline        DATE            NULL,
    status          ENUM('active','completed','abandoned') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_savings_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SAVINGS CONTRIBUTIONS
-- Log of individual top-ups towards a savings goal, so progress
-- can be tracked over time (used for "behind target" alerts).
-- ------------------------------------------------------------
CREATE TABLE savings_contributions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    savings_goal_id INT             NOT NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    date            DATE            NOT NULL,
    note            VARCHAR(255)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- RECURRING EXPENSES
-- Templates that generate reminders/alerts (e.g. rent, internet).
-- ------------------------------------------------------------
CREATE TABLE recurring_expenses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    name            VARCHAR(150)    NOT NULL,      -- e.g. "Rent", "Internet"
    amount          DECIMAL(12,2)   NOT NULL,
    category_id     INT             NOT NULL,
    frequency       ENUM('weekly','monthly','termly','yearly') NOT NULL DEFAULT 'monthly',
    start_date      DATE            NOT NULL,
    end_date        DATE            NULL,
    next_due_date   DATE            NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_due (next_due_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ALERTS
-- Notification log for budget, savings, expense and recurring alerts.
-- ------------------------------------------------------------
CREATE TABLE alerts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT             NOT NULL,
    type        ENUM('budget','savings','expense','recurring','system') NOT NULL,
    message     VARCHAR(500)    NOT NULL,
    status      ENUM('unread','read','dismissed') NOT NULL DEFAULT 'unread',
    related_id  INT             NULL,          -- optional FK-like reference (budget_id, goal_id, etc.)
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_alerts_user_status (user_id, status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MPESA TRANSACTIONS
-- Prepared for future integration only. Not used by current business
-- logic. Schema kept intentionally minimal per project scope.
-- ------------------------------------------------------------
CREATE TABLE mpesa_transactions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT             NOT NULL,
    mpesa_receipt_number VARCHAR(50)    NULL,
    phone_number        VARCHAR(20)     NULL,
    amount               DECIMAL(12,2)  NULL,
    transaction_date     DATETIME       NULL,
    status                ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
    raw_payload          JSON           NULL,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- End of schema
-- ============================================================
