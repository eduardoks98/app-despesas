-- Seed: Sample transactions for testing

-- Sample transactions for Admin User (ID: 1)
INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES 
-- Income
(1, 9, 5000.00, 'Salário Janeiro 2024', '2024-01-01', 'income'),
(1, 10, 1200.00, 'Projeto React Native', '2024-01-05', 'income'),
(1, 11, 800.00, 'Dividendos ITSA4', '2024-01-15', 'income'),

-- Expenses - January
(1, 1, -350.00, 'Mercado mensal', '2024-01-02', 'expense'),
(1, 1, -25.50, 'Almoço restaurante', '2024-01-03', 'expense'),
(1, 2, -180.00, 'Gasolina', '2024-01-04', 'expense'),
(1, 2, -45.00, 'Uber para trabalho', '2024-01-04', 'expense'),
(1, 3, -120.00, 'Cinema com família', '2024-01-06', 'expense'),
(1, 4, -200.00, 'Consulta médica', '2024-01-08', 'expense'),
(1, 5, -89.90, 'Curso online Udemy', '2024-01-10', 'expense'),
(1, 6, -150.00, 'Conta de luz', '2024-01-12', 'expense'),
(1, 7, -199.99, 'Tênis novo', '2024-01-14', 'expense'),

-- More recent transactions
(1, 1, -32.50, 'Delivery pizza', '2024-01-20', 'expense'),
(1, 2, -25.00, 'Estacionamento shopping', '2024-01-22', 'expense'),
(1, 3, -80.00, 'Jogo PS5', '2024-01-25', 'expense');

-- Sample transactions for Test User (ID: 2)
INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES 
-- Income
(2, 16, 3500.00, 'Salário Janeiro', '2024-01-01', 'income'),
(2, 17, 500.00, 'Freelance logo design', '2024-01-10', 'income'),

-- Expenses
(2, 13, -280.00, 'Mercado', '2024-01-02', 'expense'),
(2, 13, -18.50, 'Lanche', '2024-01-03', 'expense'),
(2, 14, -120.00, 'Gasolina', '2024-01-05', 'expense'),
(2, 15, -60.00, 'Cinema', '2024-01-07', 'expense'),
(2, 13, -35.00, 'Delivery', '2024-01-12', 'expense');

-- Sample transactions for Premium User (ID: 3)
INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES 
-- Income
(3, 24, 7500.00, 'Salário Premium', '2024-01-01', 'income'),
(3, 25, 2500.00, 'Dividendos carteira', '2024-01-15', 'income'),

-- Expenses
(3, 18, -450.00, 'Mercado premium', '2024-01-02', 'expense'),
(3, 19, -300.00, 'Gasolina premium', '2024-01-03', 'expense'),
(3, 20, -200.00, 'Teatro', '2024-01-05', 'expense'),
(3, 21, -1500.00, 'Plano de saúde família', '2024-01-08', 'expense'),
(3, 22, -800.00, 'Curso MBA', '2024-01-10', 'expense'),
(3, 23, -2500.00, 'Reforma cozinha', '2024-01-12', 'expense');