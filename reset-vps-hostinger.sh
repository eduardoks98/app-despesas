#!/bin/bash

# Script para resetar VPS Hostinger e configurar App Despesas
# Execute como root ou com sudo

set -e  # Parar em caso de erro

echo "========================================="
echo "Reset VPS Hostinger - App Despesas"
echo "========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para confirmar ações
confirm() {
    read -p "$1 [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Operação cancelada${NC}"
        exit 1
    fi
}

# 1. BACKUP
echo -e "${YELLOW}ETAPA 1: Backup das configurações antigas${NC}"
confirm "Deseja fazer backup das configurações atuais?"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Criando backup..."
    sudo mkdir -p /root/backup-multitenancy-$(date +%Y%m%d)
    sudo cp -r /var/www/html /root/backup-multitenancy-$(date +%Y%m%d)/ 2>/dev/null || true
    sudo cp -r /etc/apache2/sites-available /root/backup-multitenancy-$(date +%Y%m%d)/ 2>/dev/null || true
    sudo cp -r /etc/apache2/sites-enabled /root/backup-multitenancy-$(date +%Y%m%d)/ 2>/dev/null || true
    echo -e "${GREEN}Backup criado em /root/backup-multitenancy-$(date +%Y%m%d)${NC}"
fi

# 2. PARAR SERVIÇOS
echo -e "${YELLOW}ETAPA 2: Parando serviços${NC}"
sudo systemctl stop apache2
echo "Apache parado"

# 3. LIMPAR CONFIGURAÇÕES ANTIGAS
echo -e "${YELLOW}ETAPA 3: Limpando configurações antigas${NC}"
confirm "Deseja limpar /var/www/html e configurações do Apache?"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Limpar diretório web
    sudo rm -rf /var/www/html/*
    sudo rm -rf /var/www/html/.htaccess
    
    # Desabilitar sites antigos
    for site in $(ls /etc/apache2/sites-enabled/); do
        if [[ $site != "000-default.conf" ]]; then
            sudo a2dissite $site 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}Configurações antigas removidas${NC}"
fi

# 4. INSTALAR DEPENDÊNCIAS
echo -e "${YELLOW}ETAPA 4: Instalando dependências${NC}"
confirm "Deseja instalar Node.js 20 e PM2?"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # PM2
    sudo npm install -g pm2
    
    echo -e "${GREEN}Node.js $(node -v) e PM2 instalados${NC}"
fi

# 5. CONFIGURAR APACHE
echo -e "${YELLOW}ETAPA 5: Configurando Apache${NC}"

# Habilitar módulos
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers

# Criar configuração API
cat > /tmp/api.mysys.shop.conf << 'EOF'
<VirtualHost *:80>
    ServerName api.mysys.shop
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    Header set X-Real-IP %{REMOTE_ADDR}s
    Header set X-Forwarded-For %{REMOTE_ADDR}s
    Header set X-Forwarded-Proto "http"
    
    ErrorLog ${APACHE_LOG_DIR}/api.mysys.shop-error.log
    CustomLog ${APACHE_LOG_DIR}/api.mysys.shop-access.log combined
</VirtualHost>
EOF

# Criar configuração Frontend
cat > /tmp/app.mysys.shop.conf << 'EOF'
<VirtualHost *:80>
    ServerName app.mysys.shop
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
    
    Header set X-Real-IP %{REMOTE_ADDR}s
    Header set X-Forwarded-For %{REMOTE_ADDR}s
    Header set X-Forwarded-Proto "http"
    
    ErrorLog ${APACHE_LOG_DIR}/app.mysys.shop-error.log
    CustomLog ${APACHE_LOG_DIR}/app.mysys.shop-access.log combined
</VirtualHost>
EOF

# Criar redirecionamento principal
cat > /tmp/mysys.shop.conf << 'EOF'
<VirtualHost *:80>
    ServerName mysys.shop
    ServerAlias www.mysys.shop
    
    RedirectPermanent / http://app.mysys.shop/
</VirtualHost>
EOF

# Copiar configurações
sudo cp /tmp/api.mysys.shop.conf /etc/apache2/sites-available/
sudo cp /tmp/app.mysys.shop.conf /etc/apache2/sites-available/
sudo cp /tmp/mysys.shop.conf /etc/apache2/sites-available/

# Ativar sites
sudo a2ensite api.mysys.shop.conf
sudo a2ensite app.mysys.shop.conf
sudo a2ensite mysys.shop.conf

echo -e "${GREEN}Apache configurado${NC}"

# 6. CRIAR ESTRUTURA DE DIRETÓRIOS
echo -e "${YELLOW}ETAPA 6: Criando estrutura de diretórios${NC}"
sudo mkdir -p /var/www/app-despesas
sudo chown -R $USER:$USER /var/www/app-despesas

# 7. BANCO DE DADOS
echo -e "${YELLOW}ETAPA 7: Configuração do banco de dados${NC}"
confirm "Deseja criar o banco de dados app_despesas?"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Digite a senha do MySQL root:"
    read -s MYSQL_ROOT_PASS
    
    echo "Digite uma senha para o usuário app_despesas_user:"
    read -s APP_DB_PASS
    
    mysql -u root -p$MYSQL_ROOT_PASS << EOF
DROP DATABASE IF EXISTS app_despesas;
CREATE DATABASE app_despesas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'app_despesas_user'@'localhost' IDENTIFIED BY '$APP_DB_PASS';
GRANT ALL PRIVILEGES ON app_despesas.* TO 'app_despesas_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo -e "${GREEN}Banco de dados criado${NC}"
    echo -e "${YELLOW}IMPORTANTE: Anote a senha do banco: $APP_DB_PASS${NC}"
fi

# 8. REINICIAR APACHE
echo -e "${YELLOW}ETAPA 8: Reiniciando Apache${NC}"
sudo systemctl start apache2
sudo systemctl reload apache2

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Reset concluído!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo
echo "Próximos passos:"
echo "1. Clone o repositório em /var/www/app-despesas"
echo "2. Configure os arquivos .env com as credenciais corretas"
echo "3. Execute npm install e npm run build"
echo "4. Configure PM2 com o ecosystem.config.js"
echo "5. Configure SSL com certbot"
echo
echo -e "${YELLOW}Backup salvo em: /root/backup-multitenancy-$(date +%Y%m%d)${NC}"