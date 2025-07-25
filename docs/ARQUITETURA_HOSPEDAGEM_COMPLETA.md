# 🏗️ ARQUITETURA DE HOSPEDAGEM - Onde Fica Cada Coisa

## 📋 Visão Geral da Hospedagem

### **🎯 Resposta Rápida:**
- **❌ NÃO** precisa colocar todo o projeto na VPS
- **✅ SIM** apenas a API precisa estar na VPS
- **✅ Mobile app** vai para as lojas (Google Play/App Store)
- **✅ Web app** pode ir para Vercel/Netlify (gratuito)

---

## 🗺️ MAPA DE HOSPEDAGEM

```
┌─────────────────────────────────────────────────────────┐
│                 ARQUITETURA VPS CENTRALIZADA            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📱 MOBILE APP                                          │
│  ├─ Google Play Store                                   │
│  ├─ Apple App Store                                     │
│  └─ Expo OTA Updates                                    │
│                                                         │
│                         ↓                               │
│                                                         │
│  🏠 SUA VPS ÚNICA (tudo em uma)                         │
│  ├─ 🌐 Web App (Nginx - porta 80/443)                  │
│  ├─ 🔗 API Backend (Node.js - porta 3001)              │
│  ├─ 🗄️ MySQL Database (porta 3306)                     │
│  ├─ 🔒 SSL Certificate (Let's Encrypt)                 │
│  └─ 📊 Monitoring & Logs                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🏠 O QUE FICA EM CADA LOCAL

### **🖥️ Sua VPS (API + Web App + Banco):**
```bash
# Estrutura completa na VPS:
/var/www/app-despesas/
├── api/                         # API Backend
│   ├── dist/                    # Código compilado da API
│   ├── src/                     # Código fonte da API
│   ├── package.json
│   └── .env                     # Configurações do servidor
├── web/                         # Web App
│   ├── dist/                    # Build do React/Next.js
│   ├── index.html               # Página principal
│   ├── assets/                  # CSS, JS, imagens
│   └── package.json
├── database/
│   ├── schema.sql               # Estrutura do banco
│   ├── migrations/              # Migrações
│   └── backups/                 # Backups automáticos
└── nginx/
    └── app-despesas.conf        # Configuração do Nginx

# Não vai para VPS:
❌ apps/mobile/                   # Vai para as lojas
❌ Arquivos de desenvolvimento
❌ node_modules (install na VPS)
❌ Documentações e READMEs
```

### **📱 Mobile App (Lojas de Apps):**
```bash
# Google Play Store:
- app-despesas-v1.0.0.aab
- Instalado nos dispositivos Android
- Updates via OTA (Expo) ou nova versão na loja

# Apple App Store:
- app-despesas-v1.0.0.ipa  
- Instalado nos dispositivos iOS
- Updates via OTA (Expo) ou nova versão na loja
```

### **🌐 Web App (Na sua VPS):**
```bash
# Na sua VPS (mysys.shop):
- Nginx servindo arquivos estáticos
- Build automático ou manual
- HTTPS com Let's Encrypt
- Subdomínios organizados:

URLs do sistema:
🌐 https://mysys.shop                    # Landing page
📱 https://app.mysys.shop                # Web app principal
🔗 https://api.mysys.shop                # API backend
📊 https://docs.mysys.shop               # Documentação
💰 https://billing.mysys.shop            # Pagamentos/upgrade
```

---

## 🚀 PROCESSO DE DEPLOY

### **1. 🖥️ Deploy da API na VPS:**

```bash
# 1. Conectar na VPS via SSH
ssh root@sua-vps.com

# 2. Instalar Node.js e dependências
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs git

# 3. Clone apenas os arquivos necessários
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas

# 4. Install dependencies
npm install --workspaces

# 5. Build da API
cd apps/api
npm run build

# 6. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com suas configurações

# 7. Setup do banco MySQL
mysql -u root -p < ../../schema.sql

# 8. Iniciar API com PM2
npm install -g pm2
pm2 start dist/server.js --name "app-despesas-api"
pm2 startup
pm2 save

# 9. Configurar Nginx reverse proxy
nano /etc/nginx/sites-available/app-despesas-api
```

### **2. 📱 Deploy do Mobile App:**

```bash
# No seu computador de desenvolvimento:
cd apps/mobile

# Build para Android:
eas build -p android --profile production

# Build para iOS:
eas build -p ios --profile production

# Upload para as lojas:
- Google Play Console
- Apple App Store Connect
```

### **3. 🌐 Deploy do Web App (Vercel):**

```bash
# Opção 1: Vercel (Recomendado - GRATUITO)
1. Conectar GitHub com Vercel
2. Importar repositório
3. Configurar build:
   - Build Command: cd apps/web && npm run build
   - Output Directory: apps/web/dist
4. Deploy automático a cada push

# Opção 2: Na própria VPS
cd apps/web
npm run build
cp -r dist/* /var/www/html/
```

---

## 💰 CUSTOS ESTIMADOS

### **💸 Custos Mensais:**

```bash
# Hospedagem:
VPS (2GB RAM, 50GB SSD):     R$ 50-100/mês
Domínio (.com):              R$ 50/ano (R$ 4/mês)
SSL Certificate:             GRATUITO (Let's Encrypt)

# Apps (uma vez):
Google Play Developer:       R$ 125 (uma vez)
Apple Developer:             R$ 500/ano

# Terceiros:
Vercel (web app):           GRATUITO
Stripe (pagamentos):        3,4% + R$ 0,40 por transação
Email service:              R$ 30-50/mês (opcional)

# TOTAL MENSAL: ~R$ 100-150
```

### **🆓 Alternativas Gratuitas:**

```bash
# Para quem quer começar sem gastar:
VPS Gratuita:               Oracle Cloud (sempre gratuito)
Web Hosting:                Vercel/Netlify (gratuito)
Domain:                     .tk/.ml/.ga (gratuito)
SSL:                        Let's Encrypt (gratuito)
Email:                      Gmail SMTP (gratuito até 100/dia)

# TOTAL: R$ 0/mês (só taxa das lojas)
```

---

## 🔧 CONFIGURAÇÃO DA VPS

### **📦 Instalação Completa na VPS:**

```bash
#!/bin/bash
# Script de instalação automática

# 1. Atualizar sistema
apt update && apt upgrade -y

# 2. Instalar dependências
apt install -y nginx mysql-server nodejs npm git certbot python3-certbot-nginx

# 3. Configurar MySQL
mysql_secure_installation
mysql -u root -p -e "CREATE DATABASE app_despesas;"
mysql -u root -p -e "CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'senha_segura';"
mysql -u root -p -e "GRANT ALL ON app_despesas.* TO 'app_user'@'localhost';"

# 4. Clone do projeto
cd /var/www
git clone https://github.com/eduardoks98/app-despesas.git
cd app-despesas

# 5. Instalar dependências do projeto
npm install --workspaces

# 6. Build da API
cd apps/api
cp .env.example .env
# EDITAR .env COM SUAS CONFIGURAÇÕES
npm run build

# 7. Instalar PM2 para gerenciar a API
npm install -g pm2
pm2 start dist/server.js --name api

# 8. Configurar Nginx
cat > /etc/nginx/sites-available/app-despesas << EOF
server {
    listen 80;
    server_name sua-vps.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Web app (se hospedar na VPS)
    location / {
        root /var/www/app-despesas/apps/web/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 9. Ativar site
ln -s /etc/nginx/sites-available/app-despesas /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 10. SSL gratuito
certbot --nginx -d sua-vps.com

# 11. PM2 auto-start
pm2 startup
pm2 save

echo "🚀 Instalação completa!"
echo "API: https://sua-vps.com/api/health"
```

---

## 🔄 WORKFLOW DE DESENVOLVIMENTO

### **💻 No seu computador:**
```bash
# Desenvolvimento normal:
npm run dev:mobile    # Testa mobile com Expo
npm run dev:web       # Testa web localmente  
npm run dev:api       # Testa API localmente

# Quando estiver pronto:
git push origin main  # Envia código para GitHub
```

### **🚀 Deploy automático:**
```bash
# Na VPS (configurar webhook ou CI/CD):
cd /var/www/app-despesas
git pull origin main
cd apps/api
npm run build
pm2 restart api

# No Vercel (automático):
# Deploy automático quando fizer push no GitHub
```

---

## 📊 MONITORAMENTO

### **🔍 Logs e Monitoring:**
```bash
# Logs da API:
pm2 logs api

# Status dos serviços:
pm2 status
systemctl status nginx
systemctl status mysql

# Métricas de uso:
htop
df -h
free -h
```

### **🚨 Alertas:**
```bash
# Configurar alertas básicos:
- Email quando API cai
- Alerta de espaço em disco
- Monitor de CPU/RAM
- Backup automático do banco
```

---

## 🎯 RESUMO EXECUTIVO

### **✅ O que você precisa fazer:**

1. **Hoje:**
   - Contratar VPS (R$ 50-100/mês)
   - Configurar domínio
   - Fazer setup inicial

2. **Esta semana:**
   - Deploy da API na VPS
   - Configurar banco MySQL
   - Testar endpoints

3. **Próxima semana:**
   - Deploy web app no Vercel
   - Build mobile para as lojas
   - Testes de integração

### **💡 Recomendação:**
```bash
# Estrutura ideal:
VPS:        API + Banco MySQL          (R$ 80/mês)
Vercel:     Web App                     (Gratuito)  
Lojas:      Mobile Apps                 (Taxa única)
GitHub:     Código fonte                (Gratuito)

# Total: ~R$ 80/mês + taxas das lojas
```

---

**🚀 Com essa arquitetura, você terá um sistema profissional, escalável e economicamente viável!**

_A separação de responsabilidades torna tudo mais simples de gerenciar e mais barato de operar._