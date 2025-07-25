#!/bin/bash
# Script de Deploy Apache para mysys.shop no Ubuntu
# Executa na VPS para fazer deploy da API + Web App

set -e  # Exit on any error

echo "🚀 Iniciando deploy Apache para mysys.shop..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/var/www/app-despesas"
API_DIR="$PROJECT_DIR/api"
WEB_DIR="$PROJECT_DIR/web"
APACHE_CONFIG="/etc/apache2/sites-available/mysys-shop.conf"
DOMAIN="mysys.shop"

# Função para log colorido
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

log "📦 Verificando dependências do sistema..."

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências necessárias
apt install -y apache2 mysql-server nodejs npm git curl software-properties-common

# Habilitar módulos Apache necessários
a2enmod ssl
a2enmod headers
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod expires
a2enmod deflate

log "📂 Preparando estrutura de diretórios..."

# Criar estrutura de diretórios
mkdir -p $PROJECT_DIR/{api,web,docs,billing,landing,database/backups,logs}

log "🔄 Atualizando código do repositório..."

# Se é primeira instalação, clone o repo
if [ ! -d "$PROJECT_DIR/.git" ]; then
    log "📥 Clonando repositório..."
    cd /var/www
    git clone https://github.com/eduardoks98/app-despesas.git
    cd app-despesas
else
    log "🔄 Atualizando repositório existente..."
    cd $PROJECT_DIR
    git pull origin main
fi

log "🏗️ Configurando API Backend..."

# Copiar arquivos da API
cp -r apps/api/* $API_DIR/

# Instalar dependências da API
cd $API_DIR
npm install --production

# Build da API
npm run build

log "📚 Configurando documentação da API..."

# Criar página de redirecionamento da documentação
mkdir -p $PROJECT_DIR/docs
cat > $PROJECT_DIR/docs/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MySys API - Documentação</title>
    <meta http-equiv="refresh" content="0; url=/api-docs">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
            min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; text-align: center;
        }
        .container { padding: 2rem; max-width: 600px; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; }
        .btn { 
            background: rgba(255,255,255,0.2); color: white; padding: 1rem 2rem; 
            text-decoration: none; border-radius: 5px; margin: 0.5rem; display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 MySys API Docs</h1>
        <p>Redirecionando para a documentação da API...</p>
        <p>Se não foi redirecionado automaticamente:</p>
        <a href="/api-docs" class="btn">📖 Ver Documentação</a>
        <a href="https://api.mysys.shop/health" class="btn">💚 Status da API</a>
    </div>
</body>
</html>
EOF

# Configurar .env se não existir
if [ ! -f "$API_DIR/.env" ]; then
    log "⚙️ Criando arquivo .env da API..."
    cp .env.example .env
    
    # Configurações específicas para Apache
    cat >> .env << EOF

# Apache Configuration
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://mysys.shop,https://app.mysys.shop,https://billing.mysys.shop

# Database (configure com seus dados)
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=senha_segura
DB_NAME=app_despesas

# JWT Secrets (gere chaves seguras)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Master encryption key
MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
    
    warn "IMPORTANTE: Configure o arquivo $API_DIR/.env com suas credenciais reais"
    echo
fi

log "🌐 Configurando Web App..."

# Criar página web temporária se não existir
if [ ! -d "apps/web" ]; then
    log "📝 Criando página web temporária..."
    mkdir -p $WEB_DIR/dist
    cat > $WEB_DIR/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MySys - App Despesas Web</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
            min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { text-align: center; padding: 2rem; max-width: 600px; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; }
        .status { background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin: 1rem 0; }
        .btn { 
            background: rgba(255,255,255,0.2); color: white; padding: 1rem 2rem; 
            text-decoration: none; border-radius: 5px; margin: 0.5rem; display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 MySys App Despesas</h1>
        <p>Controle financeiro inteligente</p>
        <div class="status">
            <h3>🚀 Versão Web</h3>
            <p>A versão web completa estará disponível em breve!</p>
            <p>Por enquanto, baixe o app mobile:</p>
            <a href="#" class="btn">📱 Google Play</a>
            <a href="#" class="btn">🍎 App Store</a>
        </div>
        <p><strong>API Status:</strong> <span id="api-status">Verificando...</span></p>
        <p><a href="https://api.mysys.shop/health" class="btn">🔗 Testar API</a></p>
    </div>
    
    <script>
        fetch('https://api.mysys.shop/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').textContent = '✅ Online (' + data.timestamp + ')';
            })
            .catch(error => {
                document.getElementById('api-status').textContent = '❌ Offline';
            });
    </script>
</body>
</html>
EOF
fi

log "📄 Criando landing page..."

# Criar landing page
mkdir -p $PROJECT_DIR/landing
cat > $PROJECT_DIR/landing/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MySys - App Despesas | Controle Financeiro Inteligente</title>
    <meta name="description" content="Aplicativo de controle financeiro para você e sua família. Versão gratuita e premium com sincronização.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 5rem 2rem; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9; }
        .cta-button { display: inline-block; background: #fff; color: #667eea; padding: 1rem 2rem;
            text-decoration: none; border-radius: 50px; font-weight: bold; margin: 1rem;
            transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .cta-button:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .features { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; color: #333; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .feature { text-align: center; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
            transition: transform 0.3s; }
        .feature:hover { transform: translateY(-5px); }
        .feature h3 { font-size: 1.5rem; margin-bottom: 1rem; color: #667eea; }
        .feature p { color: #666; }
        .pricing { background: #f8f9fa; padding: 4rem 2rem; }
        .pricing h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 800px; margin: 0 auto; }
        .plan { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); text-align: center; }
        .plan.premium { border: 3px solid #667eea; transform: scale(1.05); }
        .plan h3 { font-size: 1.5rem; margin-bottom: 1rem; }
        .plan .price { font-size: 2rem; color: #667eea; font-weight: bold; margin-bottom: 1rem; }
        .plan ul { list-style: none; margin-bottom: 2rem; }
        .plan li { padding: 0.5rem 0; }
        .plan li:before { content: "✓ "; color: #28a745; font-weight: bold; }
        footer { background: #333; color: white; text-align: center; padding: 2rem; }
        footer a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>📱 MySys App Despesas</h1>
        <p>Controle financeiro inteligente para você e sua família</p>
        <p>🆓 Versão gratuita disponível • 💰 Premium com sincronização e web</p>
        <a href="https://app.mysys.shop" class="cta-button">🌐 Acessar Web App</a>
        <a href="#download" class="cta-button">📱 Download Mobile</a>
    </div>
    
    <div class="features">
        <h2>🚀 Funcionalidades</h2>
        <div class="feature-grid">
            <div class="feature">
                <h3>💰 Controle Completo</h3>
                <p>Gerencie receitas, despesas, parcelamentos e assinaturas em um só lugar</p>
            </div>
            <div class="feature">
                <h3>👨‍👩‍👧‍👦 Conta Família</h3>
                <p>Compartilhe gastos com seu casal e família (Premium)</p>
            </div>
            <div class="feature">
                <h3>🔄 Sincronização</h3>
                <p>Acesse seus dados em qualquer dispositivo (Premium)</p>
            </div>
            <div class="feature">
                <h3>📊 Relatórios</h3>
                <p>Gráficos e análises detalhadas dos seus gastos</p>
            </div>
            <div class="feature">
                <h3>🔒 Segurança</h3>
                <p>Seus dados protegidos com criptografia bancária</p>
            </div>
            <div class="feature">
                <h3>🌐 Multi-plataforma</h3>
                <p>Mobile e web, sempre sincronizados</p>
            </div>
        </div>
    </div>
    
    <div class="pricing">
        <h2>💰 Planos</h2>
        <div class="pricing-grid">
            <div class="plan">
                <h3>🆓 Gratuito</h3>
                <div class="price">R$ 0</div>
                <ul>
                    <li>Transações ilimitadas</li>
                    <li>Categorias básicas</li>
                    <li>Relatórios simples</li>
                    <li>Dados locais apenas</li>
                </ul>
                <a href="#download" class="cta-button">Baixar Grátis</a>
            </div>
            <div class="plan premium">
                <h3>💎 Premium</h3>
                <div class="price">R$ 9,90/mês</div>
                <ul>
                    <li>Tudo do plano gratuito</li>
                    <li>Sincronização na nuvem</li>
                    <li>Versão web completa</li>
                    <li>Conta família/casal</li>
                    <li>Relatórios avançados</li>
                    <li>Suporte prioritário</li>
                </ul>
                <a href="https://app.mysys.shop/upgrade" class="cta-button">Começar Premium</a>
            </div>
        </div>
    </div>
    
    <footer>
        <p>&copy; 2025 MySys - App Despesas. Todos os direitos reservados.</p>
        <p>
            <a href="https://api.mysys.shop/health">Status da API</a> • 
            <a href="https://docs.mysys.shop">Documentação</a> • 
            <a href="mailto:suporte@mysys.shop">Suporte</a>
        </p>
    </footer>
</body>
</html>
EOF

log "🗄️ Configurando banco de dados MySQL..."

# Configurar MySQL se necessário
if ! mysql -e "USE app_despesas;" 2>/dev/null; then
    log "Configurando banco de dados..."
    
    # Criar banco e usuário
    mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS app_despesas;
CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON app_despesas.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Importar schema
    if [ -f "apps/api/src/database/schema.sql" ]; then
        mysql -u app_user -p app_despesas < apps/api/src/database/schema.sql
    fi
fi

log "🌐 Configurando Apache..."

# Copiar configuração do Apache
cp apache-mysys-shop.conf $APACHE_CONFIG

# Ativar site e desativar default
a2ensite mysys-shop.conf
a2dissite 000-default.conf

# Testar configuração
apache2ctl configtest || error "Erro na configuração do Apache"

log "🔒 Configurando SSL com Let's Encrypt..."

# Instalar Certbot se não existir
if ! command -v certbot &> /dev/null; then
    apt install -y snapd
    snap install core; snap refresh core
    snap install --classic certbot
    ln -s /snap/bin/certbot /usr/bin/certbot
fi

# Instalar certificados SSL
if ! certbot certificates | grep -q "mysys.shop"; then
    log "Instalando certificados SSL para todos os subdomínios..."
    certbot --apache -d mysys.shop -d app.mysys.shop -d api.mysys.shop -d docs.mysys.shop -d billing.mysys.shop \
        --non-interactive --agree-tos --email admin@mysys.shop
else
    log "Certificados SSL já existem"
fi

log "⚙️ Configurando PM2 para API..."

# Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Configurar PM2
cd $API_DIR
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mysys-api',
    script: 'dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/www/app-despesas/logs/api-error.log',
    out_file: '/var/www/app-despesas/logs/api-out.log',
    log_file: '/var/www/app-despesas/logs/api-combined.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
EOF

# Parar processo anterior se existir
pm2 delete mysys-api 2>/dev/null || true

# Iniciar API
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save
pm2 startup

log "🔄 Reiniciando serviços..."

# Recarregar Apache
systemctl reload apache2

log "🧪 Testando deployment..."

sleep 5  # Aguardar serviços iniciarem

# Testar API
if curl -f -k https://api.mysys.shop/health > /dev/null 2>&1; then
    log "✅ API funcionando: https://api.mysys.shop/health"
else
    warn "⚠️ API pode não estar funcionando ainda. Verificar logs: pm2 logs mysys-api"
fi

# Testar Web App
if curl -f -k https://app.mysys.shop > /dev/null 2>&1; then
    log "✅ Web App funcionando: https://app.mysys.shop"
else
    warn "⚠️ Web App pode não estar funcionando ainda"
fi

# Testar Landing Page
if curl -f -k https://mysys.shop > /dev/null 2>&1; then
    log "✅ Landing page funcionando: https://mysys.shop"
else
    warn "⚠️ Landing page pode não estar funcionando ainda"
fi

log "📊 Status dos serviços:"
echo
pm2 status
echo
systemctl status apache2 --no-pager -l
echo

log "🎉 Deploy Apache concluído com sucesso!"
echo
echo "🌐 URLs disponíveis:"
echo "   Landing page: https://mysys.shop"
echo "   Web App:      https://app.mysys.shop"
echo "   API:          https://api.mysys.shop/health"
echo "   Docs:         https://docs.mysys.shop"
echo "   Billing:      https://billing.mysys.shop"
echo
echo "📝 Próximos passos:"
echo "   1. Configure o arquivo $API_DIR/.env com suas credenciais reais"
echo "   2. Configure senha do MySQL e ajuste conexão"
echo "   3. Teste todos os endpoints da API"
echo "   4. Configure backups automáticos"
echo "   5. Configure GitHub Actions para deploy automático"
echo
echo "📋 Logs importantes:"
echo "   API logs:     pm2 logs mysys-api"
echo "   Apache logs:  tail -f /var/log/apache2/error.log"
echo "   SSL logs:     tail -f /var/log/letsencrypt/letsencrypt.log"
echo
echo "🛠️ Comandos úteis:"
echo "   Reiniciar API:    pm2 restart mysys-api"
echo "   Reiniciar Apache: systemctl reload apache2"
echo "   Ver status:       pm2 status && systemctl status apache2"
echo

log "✨ MySys App Despesas está online no Apache!"