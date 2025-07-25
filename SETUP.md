# 🚀 **Guia Completo de Configuração - App Despesas**

## **📋 Pré-requisitos**

Antes de começar, você precisa ter instalado:
- ✅ **Node.js** (versão 18+) - [Download](https://nodejs.org/)
- ✅ **WAMP/XAMPP** - para MySQL
- ✅ **Git**
- ✅ **VS Code** (recomendado)

---

## **🔧 Passo 1: Configurar Banco de Dados MySQL**

### 1.1 Iniciar WAMP
```bash
# Inicie o WAMP e certifique-se que o MySQL está rodando
# Acesse: http://localhost/phpmyadmin
```

### 1.2 Criar Banco de Dados
```sql
-- No phpMyAdmin, execute este SQL:
CREATE DATABASE app_despesas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.3 Criar Usuário (Opcional)
```sql
-- Criar usuário específico (opcional)
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON app_despesas.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## **📦 Passo 2: Instalar Dependências**

### 2.1 Abrir Terminal na Pasta do Projeto
```bash
cd C:\wamp64\www\app-despesas
```

### 2.2 Instalar Dependências Raiz
```bash
npm install
```

### 2.3 Instalar Dependências dos Projetos
```bash
# API Backend
cd apps/api
npm install

# Web App
cd ../web
npm install

# Mobile App
cd ../mobile
npm install

# Voltar para raiz
cd ../..
```

---

## **⚙️ Passo 3: Configurar Variáveis de Ambiente**

### 3.1 API Backend (.env)
```bash
# Copiar exemplo e editar
cd apps/api
cp .env.example .env
```

**Editar `apps/api/.env`:**
```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=app_despesas
DB_CONNECTION_LIMIT=10
DB_SSL=false

# JWT Configuration
JWT_SECRET=sua-chave-secreta-muito-segura-aqui-32-caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=sua-chave-refresh-muito-segura-aqui-32-caracteres
JWT_REFRESH_EXPIRES_IN=30d

# URLs
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Email (Opcional - para depois)
EMAIL_FROM=noreply@appdespesas.com.br
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu-email@gmail.com
EMAIL_SMTP_PASS=sua-senha-app

# Stripe (Opcional - para depois)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PIX (Opcional - para depois)
PIX_API_KEY=sua-chave-pix
PIX_WEBHOOK_SECRET=seu-webhook-secret
PIX_KEY=sua-chave-pix-cpf-email
```

### 3.2 Web App (.env.local)
```bash
cd ../web
```

**Criar `apps/web/.env.local`:**
```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-nextauth-secreta-32-caracteres

# Stripe (Opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## **🗄️ Passo 4: Executar Migrações do Banco**

### 4.1 Criar Tabelas Básicas
Execute no phpMyAdmin ou MySQL:

```sql
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

-- Inserir usuário de teste
INSERT INTO users (email, name, password_hash, is_admin) VALUES 
('admin@test.com', 'Admin User', '$2b$10$hash', TRUE),
('user@test.com', 'Test User', '$2b$10$hash', FALSE);

-- Inserir categorias padrão
INSERT INTO categories (user_id, name, icon, color, is_income) VALUES 
(1, 'Alimentação', '🍽️', '#FF6B6B', FALSE),
(1, 'Transporte', '🚗', '#4ECDC4', FALSE),
(1, 'Salário', '💰', '#45B7D1', TRUE),
(1, 'Freelance', '💻', '#96CEB4', TRUE);
```

---

## **🚀 Passo 5: Testar a Aplicação**

### 5.1 Iniciar API Backend
```bash
# Terminal 1 - API
cd C:\wamp64\www\app-despesas\apps\api
npm run dev
```

Deve aparecer:
```
🚀 API Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/api/health
📚 API Documentation: http://localhost:3001/docs
```

### 5.2 Testar API
Abra no navegador: http://localhost:3001/api/health

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "version": "1.0.0"
}
```

### 5.3 Iniciar Web App
```bash
# Terminal 2 - Web
cd C:\wamp64\www\app-despesas\apps\web
npm run dev
```

Deve aparecer:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready in 2.1s
```

### 5.4 Acessar Web App
Abra no navegador: http://localhost:3000

---

## **📱 Passo 6: Testar Mobile App (Opcional)**

### 6.1 Instalar Expo CLI
```bash
npm install -g @expo/cli
```

### 6.2 Iniciar Mobile App
```bash
# Terminal 3 - Mobile
cd C:\wamp64\www\app-despesas\apps\mobile
npm start
```

### 6.3 Testar no Device
- Instale **Expo Go** no seu celular
- Escaneie o QR Code que aparece no terminal

---

## **🔧 Resolução de Problemas Comuns**

### Erro de Banco de Dados
```bash
# Verificar se MySQL está rodando
# No WAMP, verificar ícone verde do MySQL
```

### Erro de Porta em Uso
```bash
# Matar processo na porta 3001
npx kill-port 3001

# Matar processo na porta 3000  
npx kill-port 3000
```

### Erro de Dependências
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Erro de TypeScript
```bash
# Ignorar erros TS durante desenvolvimento
npm run dev -- --no-ts-check
```

---

## **🎯 Próximos Passos Após Configuração**

1. **✅ Configuração Básica** - Banco + API + Web funcionando
2. **🔐 Autenticação** - Implementar login/registro
3. **💳 Stripe** - Configurar pagamentos (opcional)
4. **📱 PIX** - Configurar pagamentos brasileiros (opcional)
5. **📧 Email** - Configurar SMTP (opcional)
6. **🚀 Deploy** - Preparar para produção

---

## **📞 Suporte**

Se encontrar problemas:
1. Verificar logs no terminal
2. Verificar se todas as portas estão livres
3. Verificar se MySQL está rodando
4. Verificar arquivos .env

**Status dos Serviços:**
- ✅ API: http://localhost:3001/api/health
- ✅ Web: http://localhost:3000
- ✅ Docs: http://localhost:3001/docs
- ✅ MySQL: http://localhost/phpmyadmin

---

🎉 **Parabéns! Sua aplicação freemium está configurada e pronta para uso!**