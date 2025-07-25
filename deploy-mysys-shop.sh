#!/bin/bash
# Script de Deploy Completo para mysys.shop
# Executa na VPS para fazer deploy da API + Web App

set -e  # Exit on any error

echo "🚀 Iniciando deploy para mysys.shop..."

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
NGINX_CONFIG="/etc/nginx/sites-available/mysys-shop"
DOMAIN="mysys.shop"

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

log "📂 Preparando estrutura de diretórios..."

# Criar estrutura de diretórios
mkdir -p $PROJECT_DIR/{api,web,docs,billing,landing,database/backups,logs,nginx}

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

# Configurar .env se não existir
if [ ! -f "$API_DIR/.env" ]; then
    log "⚙️ Criando arquivo .env da API..."
    cp .env.example .env
    
    warn "IMPORTANTE: Configure o arquivo $API_DIR/.env com suas credenciais:"
    warn "- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    warn "- JWT_SECRET, JWT_REFRESH_SECRET"
    warn "- STRIPE_SECRET_KEY"
    echo
    read -p "Pressione Enter após configurar o .env da API..."
fi

log "🌐 Configurando Web App..."

# Copiar arquivos do web (quando existir)
if [ -d "apps/web" ]; then
    cp -r apps/web/* $WEB_DIR/
    
    # Build do web app
    cd $WEB_DIR
    npm install
    npm run build
    
    # Mover build para pasta de deploy
    if [ -d "dist" ]; then
        cp -r dist/* $WEB_DIR/
    elif [ -d "build" ]; then
        cp -r build/* $WEB_DIR/
    fi
else
    log "📝 Criando página web temporária..."
    cat > $WEB_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Despesas - Web</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; }
        .status { 
            background: rgba(255,255,255,0.1); 
            padding: 1rem; 
            border-radius: 10px; 
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 App Despesas</h1>
        <p>Controle financeiro inteligente</p>
        <div class="status">
            <h3>🚀 Em Desenvolvimento</h3>
            <p>A versão web estará disponível em breve!</p>
            <p>Baixe o app mobile nas lojas:</p>
            <p>📱 Google Play • 🍎 App Store</p>
        </div>
        <p><strong>API Status:</strong> <span id="api-status">Verificando...</span></p>
    </div>
    
    <script>
        // Verificar status da API
        fetch('https://api.mysys.shop/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').textContent = '✅ Online';
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

# Criar landing page simples
cat > $PROJECT_DIR/landing/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MySys - App Despesas</title>
    <meta name="description" content="Controle financeiro inteligente para você e sua família">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5rem 2rem;
            text-align: center;
        }
        .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.5rem; margin-bottom: 2rem; }
        .cta-button {
            display: inline-block;
            background: #fff;
            color: #667eea;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin: 1rem;
            transition: all 0.3s;
        }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .features {
            padding: 5rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .feature {
            text-align: center;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .feature h3 { font-size: 1.5rem; margin-bottom: 1rem; }
        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>📱 MySys App Despesas</h1>
        <p>Controle financeiro inteligente para você e sua família</p>
        <a href="https://app.mysys.shop" class="cta-button">🌐 Acessar Web App</a>
        <a href="#download" class="cta-button">📱 Download Mobile</a>
    </div>
    
    <div class="features">
        <h2>🚀 Funcionalidades</h2>
        <div class="feature-grid">
            <div class="feature">
                <h3>🆓 Versão Gratuita</h3>
                <p>Controle básico offline no mobile</p>
            </div>
            <div class="feature">
                <h3>💰 Versão Premium</h3>
                <p>Sincronização, web app e conta familiar</p>
            </div>
            <div class="feature">
                <h3>👨‍👩‍👧‍👦 Conta Família</h3>
                <p>Compartilhe gastos com seu casal</p>
            </div>
        </div>
    </div>
    
    <footer>
        <p>&copy; 2025 MySys - App Despesas. Todos os direitos reservados.</p>
        <p>🔗 <a href="https://api.mysys.shop/health" style="color: #667eea;">Status da API</a></p>
    </footer>
</body>
</html>
EOF

log "🗄️ Configurando banco de dados..."

# Copiar schema do banco
cp apps/api/src/database/schema.sql $PROJECT_DIR/database/

# Executar migrations se banco existe
if mysql -e "USE app_despesas;" 2>/dev/null; then
    log "Banco de dados já existe, executando migrations..."
    mysql app_despesas < $PROJECT_DIR/database/schema.sql
else
    warn "Configure o banco MySQL e execute:"
    warn "mysql -u root -p < $PROJECT_DIR/database/schema.sql"
fi

log "🌐 Configurando Nginx..."

# Copiar configuração do Nginx
cp nginx-mysys-shop.conf $NGINX_CONFIG

# Ativar site
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# Testar configuração
nginx -t || error "Erro na configuração do Nginx"

log "🔒 Configurando SSL..."

# Instalar SSL para todos os subdomínios
if ! certbot certificates | grep -q "mysys.shop"; then
    log "Instalando certificados SSL..."
    certbot --nginx -d mysys.shop -d app.mysys.shop -d api.mysys.shop -d docs.mysys.shop -d billing.mysys.shop --non-interactive --agree-tos --email admin@mysys.shop
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
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/www/app-despesas/logs/api-error.log',
    out_file: '/var/www/app-despesas/logs/api-out.log',
    log_file: '/var/www/app-despesas/logs/api-combined.log',
    time: true
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

# Recarregar Nginx
systemctl reload nginx

log "🧪 Testando deployment..."

# Testar API
if curl -f https://api.mysys.shop/health > /dev/null 2>&1; then
    log "✅ API funcionando: https://api.mysys.shop/health"
else
    warn "⚠️ API pode não estar funcionando ainda"
fi

# Testar Web App
if curl -f https://app.mysys.shop > /dev/null 2>&1; then
    log "✅ Web App funcionando: https://app.mysys.shop"
else
    warn "⚠️ Web App pode não estar funcionando ainda"
fi

# Testar Landing Page
if curl -f https://mysys.shop > /dev/null 2>&1; then
    log "✅ Landing page funcionando: https://mysys.shop"
else
    warn "⚠️ Landing page pode não estar funcionando ainda"
fi

log "📊 Status dos serviços:"
echo
pm2 status
echo
systemctl status nginx --no-pager -l
echo

log "🎉 Deploy concluído com sucesso!"
echo
echo "🌐 URLs disponíveis:"
echo "   Landing page: https://mysys.shop"
echo "   Web App:      https://app.mysys.shop"
echo "   API:          https://api.mysys.shop"
echo "   Docs:         https://docs.mysys.shop"
echo "   Billing:      https://billing.mysys.shop"
echo
echo "📝 Próximos passos:"
echo "   1. Configure o arquivo $API_DIR/.env"
echo "   2. Configure o banco MySQL"
echo "   3. Teste todos os endpoints"
echo "   4. Configure backups automáticos"
echo
echo "📋 Logs importantes:"
echo "   API logs:     tail -f /var/www/app-despesas/logs/api-combined.log"
echo "   Nginx logs:   tail -f /var/log/nginx/error.log"
echo "   PM2 status:   pm2 status"
echo

log "✨ MySys App Despesas está online!"