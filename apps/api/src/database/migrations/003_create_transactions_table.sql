-- Migration: Create transactions table
-- Created: 2024-01-01

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  tags JSON,
  attachment_url VARCHAR(500),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
  recurring_interval INT DEFAULT 1,
  recurring_end_date DATE NULL,
  parent_transaction_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_amount (amount),
  INDEX idx_is_recurring (is_recurring),
  INDEX idx_created_at (created_at),
  INDEX idx_user_date (user_id, date),
  INDEX idx_user_type (user_id, type)
);