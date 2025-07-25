-- Migration: Create subscriptions table
-- Created: 2024-01-01

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stripe_subscription_id VARCHAR(191),
  stripe_customer_id VARCHAR(191),
  stripe_price_id VARCHAR(191),
  status ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid') NOT NULL,
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  trial_start TIMESTAMP NULL,
  trial_end TIMESTAMP NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_subscription (user_id, stripe_subscription_id),
  
  INDEX idx_user_id (user_id),
  INDEX idx_stripe_subscription_id (stripe_subscription_id),
  INDEX idx_stripe_customer_id (stripe_customer_id),
  INDEX idx_status (status),
  INDEX idx_current_period_end (current_period_end),
  INDEX idx_trial_end (trial_end)
);