-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS app_despesas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE app_despesas;

-- Tabela de usuários
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  is_premium BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  color VARCHAR(7),
  is_income BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de transações
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Inserir dados de teste
INSERT INTO users (email, name, password_hash, is_admin, is_premium) VALUES 
('admin@test.com', 'Admin User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, TRUE),
('user@test.com', 'Test User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', FALSE, FALSE);

-- Inserir categorias padrão para o usuário 1
INSERT INTO categories (user_id, name, icon, color, is_income) VALUES 
(1, 'Alimentação', '🍽️', '#FF6B6B', FALSE),
(1, 'Transporte', '🚗', '#4ECDC4', FALSE),
(1, 'Lazer', '🎮', '#FFA726', FALSE),
(1, 'Saúde', '🏥', '#EF5350', FALSE),
(1, 'Salário', '💰', '#45B7D1', TRUE),
(1, 'Freelance', '💻', '#96CEB4', TRUE);

-- Inserir algumas transações de exemplo
INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES 
(1, 1, -25.50, 'Almoço restaurante', '2024-01-15', 'expense'),
(1, 2, -45.00, 'Uber para trabalho', '2024-01-15', 'expense'),
(1, 5, 3500.00, 'Salário janeiro', '2024-01-01', 'income'),
(1, 3, -120.00, 'Cinema com família', '2024-01-14', 'expense'),
(1, 6, 800.00, 'Projeto freelance', '2024-01-10', 'income');