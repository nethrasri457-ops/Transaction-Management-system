-- ============================================================
-- Financial Transaction Management System - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS transaction_db;
USE transaction_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense', 'transfer') NOT NULL,
    icon VARCHAR(10) DEFAULT '💳'
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    type ENUM('credit', 'debit', 'transfer') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(255),
    reference_number VARCHAR(50) UNIQUE,
    recipient_account VARCHAR(20),
    status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'completed',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO users (name, email, account_number, balance) VALUES
('Alex Morgan', 'alex@example.com', 'ACC-001-2024', 125430.50),
('Sarah Chen', 'sarah@example.com', 'ACC-002-2024', 84200.00),
('James Rivera', 'james@example.com', 'ACC-003-2024', 230100.75);

INSERT INTO categories (name, type, icon) VALUES
('Salary', 'income', '💼'),
('Investment Return', 'income', '📈'),
('Freelance', 'income', '💻'),
('Groceries', 'expense', '🛒'),
('Utilities', 'expense', '💡'),
('Dining', 'expense', '🍽️'),
('Transport', 'expense', '🚗'),
('Healthcare', 'expense', '🏥'),
('Entertainment', 'expense', '🎬'),
('Transfer', 'transfer', '🔄');

INSERT INTO transactions (user_id, category_id, type, amount, description, reference_number, status, transaction_date) VALUES
(1, 1, 'credit', 8500.00, 'Monthly salary deposit', 'TXN-20240101-001', 'completed', '2024-01-01 09:00:00'),
(1, 4, 'debit', 320.50, 'Supermarket - weekly groceries', 'TXN-20240103-002', 'completed', '2024-01-03 14:30:00'),
(1, 6, 'debit', 89.00, 'Restaurant dinner', 'TXN-20240105-003', 'completed', '2024-01-05 20:15:00'),
(1, 2, 'credit', 1200.00, 'Stock dividends Q4', 'TXN-20240110-004', 'completed', '2024-01-10 11:00:00'),
(1, 5, 'debit', 145.00, 'Electricity bill', 'TXN-20240112-005', 'completed', '2024-01-12 10:00:00'),
(1, 7, 'debit', 65.00, 'Fuel refill', 'TXN-20240115-006', 'completed', '2024-01-15 08:45:00'),
(1, 1, 'credit', 8500.00, 'Monthly salary deposit', 'TXN-20240201-007', 'completed', '2024-02-01 09:00:00'),
(1, 9, 'debit', 220.00, 'Cinema & streaming subscriptions', 'TXN-20240205-008', 'completed', '2024-02-05 19:00:00'),
(1, 8, 'debit', 350.00, 'Doctor consultation & pharmacy', 'TXN-20240210-009', 'completed', '2024-02-10 16:00:00'),
(1, 3, 'credit', 2500.00, 'Freelance web project', 'TXN-20240215-010', 'completed', '2024-02-15 13:00:00'),
(1, 4, 'debit', 290.00, 'Grocery shopping', 'TXN-20240218-011', 'completed', '2024-02-18 15:00:00'),
(1, 1, 'credit', 8500.00, 'Monthly salary deposit', 'TXN-20240301-012', 'completed', '2024-03-01 09:00:00'),
(1, 10, 'debit', 5000.00, 'Transfer to savings account', 'TXN-20240305-013', 'completed', '2024-03-05 12:00:00'),
(1, 6, 'debit', 120.00, 'Team lunch', 'TXN-20240310-014', 'completed', '2024-03-10 13:30:00'),
(1, 2, 'credit', 950.00, 'Crypto portfolio gains', 'TXN-20240315-015', 'completed', '2024-03-15 10:00:00');
