-- Seed: Default users
-- Password for both users is: "password" (hashed with bcrypt)

INSERT INTO users (email, name, password_hash, is_admin, is_premium) VALUES 
('admin@test.com', 'Admin User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, TRUE),
('user@test.com', 'Test User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', FALSE, FALSE),
('premium@test.com', 'Premium User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', FALSE, TRUE);