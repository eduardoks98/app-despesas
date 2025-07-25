-- App Despesas Premium - MySQL Schema
-- Tabelas para versão premium com MySQL + API

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan_type ENUM('free', 'premium') DEFAULT 'free',
    subscription_id VARCHAR(255) NULL,
    subscription_status ENUM('active', 'canceled', 'expired') NULL,
    subscription_expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_plan_type (plan_type),
    INDEX idx_subscription_status (subscription_status)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    parent_id VARCHAR(36) NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_system (is_system)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(500) NOT NULL,
    date DATETIME NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    tags JSON NULL,
    notes TEXT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    installment_id VARCHAR(36) NULL,
    subscription_id VARCHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_date (user_id, date),
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_category (user_id, category_id),
    INDEX idx_date (date),
    INDEX idx_type (type)
);

-- Installments table
CREATE TABLE IF NOT EXISTS installments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    description VARCHAR(500) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    total_installments INT NOT NULL,
    current_installment INT DEFAULT 0,
    due_day INT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    start_date DATETIME NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_due_day (due_day),
    INDEX idx_start_date (start_date)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_cycle ENUM('monthly', 'quarterly', 'semiannual', 'annual') NOT NULL,
    due_day INT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    category_id VARCHAR(36) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_due_day (due_day),
    INDEX idx_billing_cycle (billing_cycle)
);

-- Sync logs table (for tracking changes)
CREATE TABLE IF NOT EXISTS sync_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    entity_type ENUM('transaction', 'category', 'installment', 'subscription') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action ENUM('create', 'update', 'delete') NOT NULL,
    data JSON NULL,
    device_id VARCHAR(255) NULL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_synced (user_id, synced_at),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_device (device_id)
);

-- Payment logs table (for Stripe integration)
CREATE TABLE IF NOT EXISTS payment_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    stripe_payment_id VARCHAR(255) NULL,
    stripe_subscription_id VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status ENUM('pending', 'succeeded', 'failed', 'canceled') NOT NULL,
    payment_method VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_payment_id (stripe_payment_id),
    INDEX idx_status (status)
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);

-- Insert default system categories
INSERT IGNORE INTO categories (id, user_id, name, icon, color, is_system) VALUES
-- These will be copied for each new user
('sys_food', 'SYSTEM', 'Alimentação', 'restaurant', '#FF6B6B', TRUE),
('sys_transport', 'SYSTEM', 'Transporte', 'directions-car', '#4ECDC4', TRUE),
('sys_health', 'SYSTEM', 'Saúde', 'local-hospital', '#45B7D1', TRUE),
('sys_entertainment', 'SYSTEM', 'Entretenimento', 'movie', '#F7DC6F', TRUE),
('sys_shopping', 'SYSTEM', 'Compras', 'shopping-cart', '#BB8FCE', TRUE),
('sys_bills', 'SYSTEM', 'Contas', 'receipt', '#F1948A', TRUE),
('sys_education', 'SYSTEM', 'Educação', 'school', '#82E0AA', TRUE),
('sys_other_expense', 'SYSTEM', 'Outros', 'more-horiz', '#AEB6BF', TRUE),
('sys_salary', 'SYSTEM', 'Salário', 'work', '#58D68D', TRUE),
('sys_freelance', 'SYSTEM', 'Freelance', 'computer', '#5DADE2', TRUE),
('sys_investment', 'SYSTEM', 'Investimentos', 'trending-up', '#F8C471', TRUE),
('sys_bonus', 'SYSTEM', 'Bonificação', 'card-giftcard', '#D7BDE2', TRUE),
('sys_other_income', 'SYSTEM', 'Outras Receitas', 'attach-money', '#A9DFBF', TRUE);