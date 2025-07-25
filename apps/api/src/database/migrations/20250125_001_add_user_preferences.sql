-- Migration: Add user preferences table
-- Created: 2025-01-25T00:00:00.000Z

CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    language VARCHAR(5) DEFAULT 'pt-BR',
    currency VARCHAR(3) DEFAULT 'BRL',
    dateFormat VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    notifications JSON NULL,
    privacy JSON NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_prefs (userId),
    INDEX idx_userId (userId)
);

-- Insert default preferences for existing users
INSERT INTO user_preferences (id, userId, createdAt, updatedAt)
SELECT UUID(), id, NOW(), NOW()
FROM users
WHERE id NOT IN (SELECT userId FROM user_preferences);

-- End of migration