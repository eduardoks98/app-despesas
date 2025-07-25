# 🗄️ **Guia de Banco de Dados - App Despesas**

## **📚 Migrations e Seeds Automáticos**

Agora você tem migrations e seeds automáticos! Não precisa mais criar banco na mão.

---

## **🚀 Comandos Principais**

### **Setup Completo (Recomendado para primeira vez):**
```bash
cd apps/api

# 1. Primeiro, certifique-se que o MySQL está rodando no WAMP
# 2. Crie apenas o banco vazio no phpMyAdmin:
CREATE DATABASE app_despesas;

# 3. Execute setup completo (migrations + seeds)
npm run db:setup
```

### **Comandos Individuais:**
```bash
# Executar apenas migrations (criar tabelas)
npm run migrate:up

# Executar apenas seeds (inserir dados de teste)
npm run seed:run

# Ver status das migrations
npm run migrate:status

# Ver status dos seeds
npm run seed:status

# Reset completo (limpar tudo e recriar)
npm run db:fresh
```

---

## **📁 Estrutura dos Arquivos**

```
apps/api/src/database/
├── migrations/           # Arquivos SQL de estrutura
│   ├── 001_create_users_table.sql
│   ├── 002_create_categories_table.sql
│   ├── 003_create_transactions_table.sql
│   ├── 004_create_budgets_table.sql
│   ├── 005_create_subscriptions_table.sql
│   ├── 006_create_payment_methods_table.sql
│   ├── 007_create_pix_charges_table.sql
│   └── 008_create_refresh_tokens_table.sql
│
├── seeds/               # Dados iniciais de teste
│   ├── 001_default_users.sql
│   ├── 002_default_categories.sql
│   └── 003_sample_transactions.sql
│
├── migrate.ts          # Gerenciador de migrations
└── seed.ts             # Gerenciador de seeds
```

---

## **👥 Usuários de Teste Criados**

Após executar os seeds, você terá 3 usuários de teste:

| Email | Senha | Tipo | Premium |
|-------|-------|------|---------|
| `admin@test.com` | `password` | Admin | ✅ Sim |
| `user@test.com` | `password` | User | ❌ Não |
| `premium@test.com` | `password` | User | ✅ Sim |

---

## **🏷️ Categorias Criadas**

### **Despesas:**
- 🍽️ Alimentação
- 🚗 Transporte  
- 🎮 Lazer
- 🏥 Saúde
- 📚 Educação
- 🏠 Casa
- 👕 Roupas
- 💸 Outros Gastos

### **Receitas:**
- 💰 Salário
- 💻 Freelance
- 📈 Investimentos
- 💵 Outros Ganhos

---

## **💳 Transações de Exemplo**

O seed cria transações de exemplo para cada usuário:
- **Receitas**: Salários, freelances, dividendos
- **Despesas**: Mercado, transporte, lazer, saúde, etc.
- **Período**: Janeiro 2024
- **Valores**: Realistas para teste

---

## **🔧 Comandos Avançados**

### **Reset e Recriar Tudo:**
```bash
# Limpar dados de seeds e executar novamente
npm run seed:reset
npm run seed:run

# Reset completo (migrations + seeds)
npm run db:fresh
```

### **Verificar Status:**
```bash
# Ver quais migrations foram executadas
npm run migrate:status

# Ver quais seeds foram executados  
npm run seed:status
```

### **Desenvolvimento:**
```bash
# Se você mudar um seed e quiser executar novamente
npm run seed:reset
npm run seed:run
```

---

## **✅ Checklist de Setup**

1. **✅ WAMP rodando** - MySQL ativo
2. **✅ Banco criado** - `app_despesas` no phpMyAdmin
3. **✅ Dependências** - `npm install` executado
4. **✅ Variáveis** - arquivo `.env` configurado
5. **✅ Migrations** - `npm run migrate:up`
6. **✅ Seeds** - `npm run seed:run`

---

## **📊 Resultado Final**

Após executar tudo, você terá:

### **✅ Tabelas Criadas:**
- `users` - Usuários do sistema
- `categories` - Categorias de transações  
- `transactions` - Transações dos usuários
- `budgets` - Orçamentos (para features futuras)
- `subscriptions` - Assinaturas Stripe
- `payment_methods` - Métodos de pagamento
- `pix_charges` - Cobranças PIX
- `refresh_tokens` - Tokens de autenticação
- `migrations` - Controle de migrations
- `seeds` - Controle de seeds

### **✅ Dados de Teste:**
- 3 usuários diferentes (admin, user, premium)
- Categorias padrão para cada usuário
- Transações de exemplo realistas
- Tudo pronto para testar a aplicação!

---

## **🚨 Troubleshooting**

### **Erro: Banco não existe**
```bash
# Criar banco manualmente no phpMyAdmin:
CREATE DATABASE app_despesas;
```

### **Erro: Tabela já existe**
```bash
# Ver status das migrations
npm run migrate:status

# Se necessário, dropar banco e recriar
DROP DATABASE app_despesas;
CREATE DATABASE app_despesas;
npm run db:setup
```

### **Erro: Permissões MySQL**
```bash
# Verificar se o MySQL está rodando no WAMP
# Verificar credenciais no arquivo .env
```

### **Erro: Seeds duplicados**
```bash
# Reset seeds e executar novamente
npm run seed:reset
npm run seed:run
```

---

## **🎯 Próximo Passo**

Depois de executar as migrations e seeds:

1. **Testar API**: `npm run dev`
2. **Acessar Health**: http://localhost:3001/api/health
3. **Ver Dados**: Conferir tabelas no phpMyAdmin
4. **Fazer Login**: Usar credenciais de teste no web app

**✨ Agora sim, tudo automatizado e profissional!** 🚀