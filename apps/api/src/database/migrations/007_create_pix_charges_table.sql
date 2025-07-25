-- Migration: Create pix_charges table
-- Created: 2024-01-01

CREATE TABLE pix_charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  external_id VARCHAR(191) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  qr_code TEXT NOT NULL,
  qr_code_image_url VARCHAR(500),
  pix_key VARCHAR(255) NOT NULL,
  status ENUM('pending', 'paid', 'expired', 'cancelled') DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  paid_at TIMESTAMP NULL,
  paid_amount DECIMAL(15,2) NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_document VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_external_id (external_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  INDEX idx_paid_at (paid_at),
  INDEX idx_created_at (created_at)
);