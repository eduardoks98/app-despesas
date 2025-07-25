# 🚀 **Guia Completo de Configuração - App Despesas Freemium**

> **Transforme seu app de despesas em uma plataforma SaaS completa!**

## **📋 O Que Você Vai Configurar**

✅ **Backend API** (Node.js + TypeScript + MySQL)  
✅ **Web App** (Next.js 14 + TailwindCSS)  
✅ **Mobile App** (React Native + Expo)  
✅ **Dashboard Admin** com analytics  
✅ **Sistema de Pagamentos** (Stripe + PIX)  
✅ **Autenticação** completa  

---

## **🛠️ Pré-requisitos**

Certifique-se de ter instalado:
- ✅ **Node.js** (versão 18+) - [Download](https://nodejs.org/)
- ✅ **WAMP/XAMPP** - para MySQL (já tem)
- ✅ **Git** (já tem)
- ✅ **VS Code** (recomendado)

---

## **🔧 PASSO 1: Configurar Banco de Dados MySQL**

### 1.1 Iniciar WAMP
```bash
# 1. Inicie o WAMP
# 2. Certifique-se que o ícone do MySQL está verde
# 3. Acesse: http://localhost/phpmyadmin
```

### 1.2 Executar Script de Banco
1. No phpMyAdmin, vá em **SQL**
2. Copie e cole o conteúdo do arquivo `database-setup.sql`:

```sql
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

-- Inserir categorias padrão
INSERT INTO categories (user_id, name, icon, color, is_income) VALUES 
(1, 'Alimentação', '🍽️', '#FF6B6B', FALSE),
(1, 'Transporte', '🚗', '#4ECDC4', FALSE),
(1, 'Lazer', '🎮', '#FFA726', FALSE),
(1, 'Saúde', '🏥', '#EF5350', FALSE),
(1, 'Salário', '💰', '#45B7D1', TRUE),
(1, 'Freelance', '💻', '#96CEB4', TRUE);

-- Inserir transações de exemplo
INSERT INTO transactions (user_id, category_id, amount, description, date, type) VALUES 
(1, 1, -25.50, 'Almoço restaurante', '2024-01-15', 'expense'),
(1, 2, -45.00, 'Uber para trabalho', '2024-01-15', 'expense'),
(1, 5, 3500.00, 'Salário janeiro', '2024-01-01', 'income'),
(1, 3, -120.00, 'Cinema com família', '2024-01-14', 'expense'),
(1, 6, 800.00, 'Projeto freelance', '2024-01-10', 'income');
```

3. Clique em **Executar**

---

## **📦 PASSO 2: Instalar Dependências**

### 2.1 Abrir Terminal no Projeto
```bash
# Navegar até a pasta do projeto
cd C:\wamp64\www\app-despesas
```

### 2.2 Instalar Dependências Raiz
```bash
npm install
```

### 2.3 Instalar Dependências dos Sub-projetos
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

## **⚙️ PASSO 3: Configurar Variáveis de Ambiente**

### 3.1 API Backend (.env)
Arquivo: `apps/api/.env` (já existe)

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

# Stripe (Opcional - para pagamentos)
STRIPE_SECRET_KEY=sk_test_demo
STRIPE_WEBHOOK_SECRET=whsec_demo
STRIPE_PRICE_ID_MONTHLY=price_demo
STRIPE_PRICE_ID_YEARLY=price_demo

# PIX (Opcional - para pagamentos brasileiros)
PIX_API_KEY=sua-chave-pix
PIX_WEBHOOK_SECRET=seu-webhook-secret
PIX_KEY=sua-chave-pix-cpf-email

# Email (Opcional)
EMAIL_FROM=noreply@appdespesas.com.br
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu-email@gmail.com
EMAIL_SMTP_PASS=sua-senha-app
```

### 3.2 Web App (.env.local)
Arquivo: `apps/web/.env.local` (já existe)

```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-nextauth-secreta-32-caracteres

# Stripe (Opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_demo
```

---

## **🚀 PASSO 4: Executar e Testar**

### 4.1 Iniciar API Backend
**Terminal 1:**
```bash
cd C:\wamp64\www\app-despesas\apps\api
npm run dev
```

**Deve aparecer:**
```
🚀 API Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/api/health
📚 API Documentation: http://localhost:3001/docs
```

### 4.2 Testar API
Abra no navegador: http://localhost:3001/api/health

**Deve retornar:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "version": "1.0.0"
}
```

### 4.3 Iniciar Web App
**Terminal 2:**
```bash
cd C:\wamp64\www\app-despesas\apps\web
npm run dev
```

**Deve aparecer:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready in 2.1s
```

### 4.4 Acessar Web App
Abra no navegador: **http://localhost:3000**

---

## **🔐 PASSO 5: Fazer Login de Teste**

### Credenciais de Teste:
- **Admin**: 
  - Email: `admin@test.com`
  - Senha: `password`
  - Acesso: Admin Dashboard + Todas as features

- **Usuário**: 
  - Email: `user@test.com`
  - Senha: `password`
  - Acesso: Features básicas

---

## **📱 PASSO 6: Testar Mobile App (Opcional)**

### 6.1 Instalar Expo CLI
```bash
npm install -g @expo/cli
```

### 6.2 Iniciar Mobile App
**Terminal 3:**
```bash
cd C:\wamp64\www\app-despesas\apps\mobile
npm start
```

### 6.3 Testar no Device
1. Instale **Expo Go** no seu celular
2. Escaneie o QR Code que aparece no terminal

---

## **🎯 O QUE VOCÊ PODE TESTAR AGORA**

### **🌐 Web App (http://localhost:3000)**
✅ **Dashboard** com gráficos interativos  
✅ **Transações** - Adicionar, editar, excluir  
✅ **Categorias** - Gerenciar categorias personalizadas  
✅ **Relatórios** - Análises avançadas (Premium)  
✅ **Analytics** - Insights detalhados (Premium)  
✅ **Upgrade** - Sistema de assinatura premium  
✅ **Billing** - Gerenciar pagamentos e faturas  
✅ **PIX** - Pagamentos instantâneos brasileiros  
✅ **Admin** - Dashboard administrativo (Admin only)  

### **🔧 API (http://localhost:3001)**
✅ **Health Check** - `/api/health`  
✅ **Documentação** - `/docs` (Swagger UI)  
✅ **Autenticação** - Login/Register  
✅ **Transações** - CRUD completo  
✅ **Pagamentos** - Stripe + PIX  
✅ **Webhooks** - Processamento automático  

### **📱 Mobile App**
✅ **Sincronização** - Cloud backup  
✅ **Relatórios** - Exportação  
✅ **Offline** - Funciona sem internet  
✅ **Push** - Notificações  

---

## **🔧 Resolução de Problemas**

### ❌ Erro de Banco de Dados
```bash
# Verificar se MySQL está rodando
# No WAMP, verificar ícone verde do MySQL
# Verificar credenciais no .env
```

### ❌ Erro de Porta em Uso
```bash
# Matar processo na porta 3001
npx kill-port 3001

# Matar processo na porta 3000  
npx kill-port 3000
```

### ❌ Erro de Dependências
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erro de Build/TypeScript
```bash
# Para desenvolvimento, pode ignorar erros TS
npm run dev -- --no-check
```

---

## **📊 Status dos Serviços**

Depois de configurado, você terá:

| Serviço | URL | Status |
|---------|-----|--------|
| 🌐 **Web App** | http://localhost:3000 | ✅ |
| 🔧 **API Health** | http://localhost:3001/api/health | ✅ |
| 📚 **API Docs** | http://localhost:3001/docs | ✅ |
| 🗄️ **Database** | http://localhost/phpmyadmin | ✅ |
| 📱 **Mobile** | Expo Go App | ✅ |

---

## **🎯 Próximos Passos**

Após configurar tudo:

### **Imediatos:**
1. ✅ Testar todas as funcionalidades
2. ✅ Criar suas próprias transações
3. ✅ Explorar o dashboard admin
4. ✅ Testar sistema de upgrade

### **Configurações Avançadas (Opcional):**
1. 💳 **Configurar Stripe** - Para pagamentos reais
2. 📱 **Configurar PIX** - Para mercado brasileiro  
3. 📧 **Configurar SMTP** - Para emails
4. 🚀 **Deploy** - Subir para produção

### **Personalização:**
1. 🎨 **Customizar tema**
2. 🏢 **Adicionar sua marca**
3. 📊 **Configurar analytics**
4. 🔧 **Ajustar features**

---

## **🎉 Parabéns!**

**Você agora tem uma plataforma SaaS freemium completa:**

🚀 **Backend API** robusto e escalável  
🌐 **Web App** moderno e responsivo  
📱 **Mobile App** nativo  
💳 **Sistema de Pagamentos** integrado  
📊 **Dashboard Admin** com analytics  
🔐 **Autenticação** completa  
🐳 **Docker** e CI/CD configurados  

**Sua aplicação está pronta para:**
- ✅ Uso em desenvolvimento
- ✅ Testes com usuários reais  
- ✅ Deploy em produção
- ✅ Monetização imediata

---

## **📞 Suporte**

Se encontrar algum problema:

1. 📋 **Verificar logs** nos terminais
2. 🔍 **Verificar portas** (3000, 3001, 3306)
3. 🗄️ **Verificar MySQL** no WAMP
4. ⚙️ **Verificar arquivos .env**
5. 📚 **Consultar documentação** em `/docs`

**Dica:** Mantenha os terminais abertos para ver os logs em tempo real!

---

**🎯 Agora é só seguir este guia passo a passo e ter sua plataforma funcionando!** 🚀