# 🚀 **Guia Completo de Setup - App Despesas**

> **Configuração passo a passo da plataforma SaaS freemium completa**

## **📋 O Que Você Vai Configurar**

✅ **Backend API** (Node.js + TypeScript + MySQL)  
✅ **Web App** (Next.js 14 + TailwindCSS)  
✅ **Mobile App** (React Native + Expo)  
✅ **Dashboard Admin** com analytics avançados  
✅ **Sistema de Pagamentos** (Stripe + PIX)  
✅ **Autenticação JWT** completa  
✅ **Sistema Freemium** com planos pagos  

---

## **🛠️ Pré-requisitos**

Certifique-se de ter instalado:
- ✅ **Node.js** (versão 18+) - [Download](https://nodejs.org/)
- ✅ **WAMP/XAMPP** - para MySQL
- ✅ **Git** 
- ✅ **VS Code** (recomendado)

---

## **🔧 PASSO 1: Configurar Banco de Dados MySQL**

### 1.1 Iniciar WAMP
```bash
# 1. Inicie o WAMP
# 2. Certifique-se que o ícone do MySQL está verde
# 3. Acesse: http://localhost/phpmyadmin
```

### 1.2 Executar Migrations
O projeto usa um sistema de migrations para criar o banco de dados. Execute:

```bash
# Navegar para a API
cd apps/api

# Executar migrations
npm run migrate

# Inserir dados de exemplo
npm run seed
```

> **Nota:** As migrations criam automaticamente:
> - Banco de dados `app_despesas`
> - Todas as tabelas necessárias
> - Usuários de teste com senhas válidas
> - Dados de exemplo para testar

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
Arquivo: `apps/api/.env`

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
JWT_SECRET=sua-chave-secreta-muito-segura-aqui-32-caracteres-jwt
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
STRIPE_PRICE_ID_MONTHLY=price_demo_monthly
STRIPE_PRICE_ID_YEARLY=price_demo_yearly

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

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Web App (.env.local)
Arquivo: `apps/web/.env.local`

```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-nextauth-secreta-32-caracteres-muito-longa

# Stripe (Opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_demo

# Features Flags
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_PIX=true
NEXT_PUBLIC_ENABLE_MOBILE_APP=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3.3 Mobile App (.env)
Arquivo: `apps/mobile/.env`

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WEB_URL=http://localhost:3000

# App Configuration
EXPO_PUBLIC_APP_NAME=App Despesas
EXPO_PUBLIC_APP_VERSION=1.0.0
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
✅ Database connected successfully
```

### 4.2 Testar API
Abra no navegador: http://localhost:3001/api/health

**Deve retornar:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "version": "1.0.0",
  "database": "connected",
  "environment": "development"
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

### Credenciais de Teste (senha: `password`):

**🔑 Admin Completo:**
- Email: `admin@test.com`
- Senha: `password`
- Acesso: Dashboard Admin + Todas as features + Analytics

**👤 Usuário Básico:**
- Email: `user@test.com`
- Senha: `password`
- Acesso: Features básicas (limitadas)

**⭐ Usuário Premium:**
- Email: `premium@test.com`
- Senha: `password`
- Acesso: Todas as features premium

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
✅ **Dashboard** com gráficos interativos e métricas  
✅ **Transações** - Adicionar, editar, excluir com validações  
✅ **Categorias** - Gerenciar categorias personalizadas com ícones  
✅ **Relatórios** - Análises avançadas e exportação (Premium)  
✅ **Analytics** - Insights detalhados e tendências (Premium)  
✅ **Upgrade** - Sistema de assinatura premium integrado  
✅ **Billing** - Gerenciar pagamentos e faturas  
✅ **PIX** - Pagamentos instantâneos brasileiros  
✅ **Admin** - Dashboard administrativo completo (Admin only)  
✅ **Perfil** - Configurações de usuário e preferências  

### **🔧 API (http://localhost:3001)**
✅ **Health Check** - `/api/health`  
✅ **Documentação** - `/docs` (Swagger UI interativa)  
✅ **Autenticação** - Login/Register com JWT  
✅ **Transações** - CRUD completo com filtros  
✅ **Categorias** - Gerenciamento completo  
✅ **Usuários** - Perfis e configurações  
✅ **Pagamentos** - Stripe + PIX + Webhooks  
✅ **Admin** - Endpoints administrativos  
✅ **Analytics** - Métricas e relatórios  

### **📱 Mobile App**
✅ **Sincronização** - Cloud backup automático  
✅ **Relatórios** - Exportação PDF/Excel  
✅ **Offline** - Funciona sem internet  
✅ **Push** - Notificações personalizadas  
✅ **Biometria** - Login com digital/face  

---

## **💡 Funcionalidades por Plano**

### **🆓 Plano Gratuito**
- ✅ Até 50 transações/mês
- ✅ 5 categorias personalizadas
- ✅ Dashboard básico
- ✅ Relatórios simples
- ❌ Exportação limitada

### **⭐ Plano Premium ($19.90/mês)**
- ✅ Transações ilimitadas
- ✅ Categorias ilimitadas
- ✅ Dashboard avançado com gráficos
- ✅ Relatórios detalhados
- ✅ Exportação completa (PDF, Excel, CSV)
- ✅ Analytics e insights
- ✅ Backup automático
- ✅ Suporte prioritário

### **👑 Plano Admin**
- ✅ Todas as features premium
- ✅ Dashboard administrativo
- ✅ Gerenciar usuários
- ✅ Analytics da plataforma  
- ✅ Relatórios de receita
- ✅ Configurações globais

---

## **🔧 Sistema de Migrations**

O projeto utiliza um sistema de migrations para gerenciar o banco de dados:

### Comandos Disponíveis:
```bash
# Executar todas as migrations pendentes
npm run migrate

# Reverter última migration
npm run migrate:rollback

# Status das migrations
npm run migrate:status

# Criar nova migration
npm run migrate:create nome_da_migration

# Popular banco com dados de exemplo
npm run seed
```

### Estrutura das Migrations:
```
apps/api/src/database/migrations/
├── 001_create_users_table.sql
├── 002_create_categories_table.sql
├── 003_create_transactions_table.sql
├── 004_create_budgets_table.sql
├── 005_create_subscriptions_table.sql
├── 006_create_payment_methods_table.sql
├── 007_create_pix_charges_table.sql
└── 008_create_refresh_tokens_table.sql
```

### Seeds (Dados de Exemplo):
```
apps/api/src/database/seeds/
├── 001_default_users.sql
├── 002_default_categories.sql
└── 003_sample_transactions.sql
```

---

## **🔧 Resolução de Problemas Comuns**

### ❌ Erro de Banco de Dados
```bash
# Verificar se MySQL está rodando no WAMP
# Ícone deve estar verde
# Testar conexão: http://localhost/phpmyadmin

# Recriar banco de dados completamente
npm run db:reset
npm run migrate
npm run seed
```

### ❌ Erro de Migration
```bash
# Ver status das migrations
npm run migrate:status

# Reverter e aplicar novamente
npm run migrate:rollback
npm run migrate

# Resetar banco completamente
npm run db:reset
```

### ❌ Erro de Porta em Uso
```bash
# Matar processo na porta 3001 (API)
npx kill-port 3001

# Matar processo na porta 3000 (Web)
npx kill-port 3000

# Verificar portas em uso
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

### ❌ Erro de Dependências
```bash
# Limpar cache e reinstalar (cada projeto)
cd apps/api
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

cd ../web
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

cd ../mobile
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erro de Build/TypeScript
```bash
# Para desenvolvimento, pode ignorar erros TS temporariamente
npm run dev -- --no-check

# Ou corrigir erros TS executando
npm run type-check
```

### ❌ Erro de CORS
```bash
# Verificar CORS_ORIGIN no .env da API
# Deve incluir: http://localhost:3000,http://localhost:5173

# Limpar cache do navegador
# Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
```

### ❌ Erro de JWT/Autenticação
```bash
# Verificar JWT_SECRET no .env (mínimo 32 caracteres)
# Verificar NEXTAUTH_SECRET no .env.local
# Limpar cookies do navegador

# Regenerar secrets se necessário
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## **📊 Status dos Serviços**

Depois de configurado, você terá:

| Serviço | URL | Status | Funcionalidade |
|---------|-----|--------|----------------|
| 🌐 **Web App** | http://localhost:3000 | ✅ | Interface principal |
| 🔧 **API Health** | http://localhost:3001/api/health | ✅ | Status da API |
| 📚 **API Docs** | http://localhost:3001/docs | ✅ | Swagger UI |
| 🗄️ **Database** | http://localhost/phpmyadmin | ✅ | MySQL Admin |
| 📱 **Mobile** | Expo Go App | ✅ | App móvel |
| 👑 **Admin** | http://localhost:3000/admin | ✅ | Dashboard admin |

---

## **🎯 Próximos Passos Após Configuração**

### **Imediatos (Teste tudo):**
1. ✅ **Login** com as 3 contas diferentes
2. ✅ **Criar transações** e testar categorias
3. ✅ **Explorar dashboard** e gráficos
4. ✅ **Testar sistema de upgrade** (user → premium)
5. ✅ **Acessar admin panel** (apenas admin@test.com)

### **Configurações de Produção (Opcional):**
1. 💳 **Configurar Stripe** - Chaves reais para pagamentos
2. 📱 **Configurar PIX** - Para mercado brasileiro  
3. 📧 **Configurar SMTP** - Para emails transacionais
4. 🔐 **Configurar SSL** - Certificados HTTPS
5. 🚀 **Deploy** - Heroku, Vercel, DigitalOcean

### **Personalização da Marca:**
1. 🎨 **Customizar cores** - Tema da sua marca
2. 🏢 **Logo e branding** - Identidade visual
3. 📊 **Configurar analytics** - Google Analytics, Mixpanel
4. 🔧 **Ajustar features** - Habilitar/desabilitar funcionalidades
5. 💰 **Definir preços** - Valores dos planos premium

### **Desenvolvimento:**
1. 🔧 **Criar novas migrations** - Para mudanças no banco
2. 📊 **Adicionar métricas** - Monitoramento customizado
3. 🎨 **Customizar UI** - Interface personalizada
4. 🧪 **Escrever testes** - Garantir qualidade
5. 📱 **Otimizar mobile** - Performance e UX

---

## **🎉 Parabéns! Sua Plataforma SaaS Está Pronta!**

**Você agora tem uma plataforma freemium completa:**

🚀 **Backend API** - Robusto, escalável e documentado  
🌐 **Web App** - Interface moderna e responsiva  
📱 **Mobile App** - App nativo para iOS/Android  
💳 **Pagamentos** - Stripe + PIX integrados  
📊 **Analytics** - Dashboard admin com métricas  
🔐 **Autenticação** - JWT seguro e NextAuth  
🗄️ **Migrations** - Sistema de banco versionado  
🐳 **Docker** - Containerização completa  

**Status da aplicação:**
- ✅ **Desenvolvimento** - Pronta para desenvolver
- ✅ **Testes** - Pronta para usuários beta  
- ✅ **Produção** - Pronta para deploy
- ✅ **Monetização** - Pronta para gerar receita

---

## **📞 Suporte e Debugging**

### **Logs Importantes:**
```bash
# API Logs
tail -f apps/api/logs/app.log

# Web App Logs (terminal)
# Acompanhar no terminal onde rodou npm run dev

# Database Logs (MySQL)
# Ver no WAMP ou phpMyAdmin

# Migration Logs
npm run migrate:status
```

### **Comandos Úteis:**
```bash
# Verificar status dos serviços
curl http://localhost:3001/api/health
curl http://localhost:3000/api/auth/session

# Restart completo
npx kill-port 3000 3001
npm run dev (em cada projeto)

# Verificar banco de dados
mysql -u root -p app_despesas
SHOW TABLES;
SELECT COUNT(*) FROM users;

# Status das migrations
npm run migrate:status
```

### **Arquivos de Configuração Importantes:**
- `apps/api/.env` - Configurações da API
- `apps/web/.env.local` - Configurações do Web App  
- `apps/mobile/.env` - Configurações do Mobile
- `apps/api/src/database/migrate.ts` - Sistema de migrations
- `package.json` - Scripts e dependências
- `docker-compose.yml` - Configuração Docker

---

## **🎯 Quick Start Checklist**

- [ ] MySQL rodando no WAMP
- [ ] Dependências instaladas (npm install em todos)
- [ ] Arquivos .env configurados
- [ ] Migrations executadas (npm run migrate)
- [ ] Seeds inseridos (npm run seed)
- [ ] API rodando na porta 3001
- [ ] Web App rodando na porta 3000
- [ ] Login funcionando com credenciais de teste
- [ ] Dashboard carregando com dados
- [ ] Mobile app rodando (opcional)

**🎉 Se todos os itens estão ✅, sua plataforma está funcionando perfeitamente!**

---

**Dica Final:** Mantenha 2-3 terminais abertos para ver logs em tempo real e use o sistema de migrations para todas as mudanças no banco! 🚀