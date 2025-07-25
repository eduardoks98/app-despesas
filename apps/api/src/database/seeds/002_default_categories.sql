-- Seed: Default categories for users

-- Categories for Admin User (ID: 1)
INSERT INTO categories (user_id, name, icon, color, is_income, sort_order) VALUES 
(1, 'Alimentação', '🍽️', '#FF6B6B', FALSE, 1),
(1, 'Transporte', '🚗', '#4ECDC4', FALSE, 2),
(1, 'Lazer', '🎮', '#FFA726', FALSE, 3),
(1, 'Saúde', '🏥', '#EF5350', FALSE, 4),
(1, 'Educação', '📚', '#AB47BC', FALSE, 5),
(1, 'Casa', '🏠', '#5C6BC0', FALSE, 6),
(1, 'Roupas', '👕', '#FF7043', FALSE, 7),
(1, 'Outros Gastos', '💸', '#78909C', FALSE, 8),
(1, 'Salário', '💰', '#45B7D1', TRUE, 1),
(1, 'Freelance', '💻', '#96CEB4', TRUE, 2),
(1, 'Investimentos', '📈', '#81C784', TRUE, 3),
(1, 'Outros Ganhos', '💵', '#AED581', TRUE, 4);

-- Categories for Test User (ID: 2)
INSERT INTO categories (user_id, name, icon, color, is_income, sort_order) VALUES 
(2, 'Alimentação', '🍽️', '#FF6B6B', FALSE, 1),
(2, 'Transporte', '🚗', '#4ECDC4', FALSE, 2),
(2, 'Lazer', '🎮', '#FFA726', FALSE, 3),
(2, 'Salário', '💰', '#45B7D1', TRUE, 1),
(2, 'Freelance', '💻', '#96CEB4', TRUE, 2);

-- Categories for Premium User (ID: 3)
INSERT INTO categories (user_id, name, icon, color, is_income, sort_order) VALUES 
(3, 'Alimentação', '🍽️', '#FF6B6B', FALSE, 1),
(3, 'Transporte', '🚗', '#4ECDC4', FALSE, 2),
(3, 'Lazer', '🎮', '#FFA726', FALSE, 3),
(3, 'Saúde', '🏥', '#EF5350', FALSE, 4),
(3, 'Educação', '📚', '#AB47BC', FALSE, 5),
(3, 'Casa', '🏠', '#5C6BC0', FALSE, 6),
(3, 'Salário', '💰', '#45B7D1', TRUE, 1),
(3, 'Investimentos', '📈', '#81C784', TRUE, 2);