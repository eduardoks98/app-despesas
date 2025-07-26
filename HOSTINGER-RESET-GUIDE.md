# Guia para Resetar VPS Hostinger e Configurar App Despesas

## ⚠️ IMPORTANTE: Fazer Backup Primeiro!

```bash
# Conectar na VPS via SSH
ssh root@seu-ip-vps

# Criar backup das configurações antigas
sudo mkdir -p /root/backup-multitenancy
sudo cp -r /var/www/html /root/backup-multitenancy/
sudo cp -r /etc/apache2/sites-available /root/backup-multitenancy/
sudo cp -r /etc/apache2/sites-enabled /root/backup-multitenancy/
```

## 1. Limpar Configurações Antigas

### Parar serviços
```bash
sudo systemctl stop apache2
sudo systemctl stop mysql
```

### Limpar diretórios web
```bash
# Remover aplicação antiga (após backup!)
sudo rm -rf /var/www/html/*
sudo rm -rf /var/www/html/.htaccess

# Criar nova estrutura
sudo mkdir -p /var/www/app-despesas
sudo chown -R www-data:www-data /var/www/app-despesas
```

### Desabilitar sites antigos do Apache
```bash
# Listar sites habilitados
sudo ls /etc/apache2/sites-enabled/

# Desabilitar sites antigos (substitua pelos nomes reais)
sudo a2dissite 000-default.conf
sudo a2dissite seu-site-antigo.conf

# Remover configurações antigas
sudo rm /etc/apache2/sites-available/*multitenancy*
sudo rm /etc/apache2/sites-enabled/*multitenancy*
```

## 2. Instalar Dependências Necessárias

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Verificar versões
node --version  # Deve mostrar v20.x.x
npm --version
```

## 3. Configurar Apache como Proxy Reverso

### Habilitar módulos necessários
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
```

### Criar configuração para API
```bash
sudo nano /etc/apache2/sites-available/api.mysys.shop.conf
```

Conteúdo:
```apache
<VirtualHost *:80>
    ServerName api.mysys.shop
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy para API Node.js
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # Headers
    Header set X-Real-IP %{REMOTE_ADDR}s
    Header set X-Forwarded-For %{REMOTE_ADDR}s
    Header set X-Forwarded-Proto "http"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/api.mysys.shop-error.log
    CustomLog ${APACHE_LOG_DIR}/api.mysys.shop-access.log combined
</VirtualHost>
```

### Criar configuração para Frontend
```bash
sudo nano /etc/apache2/sites-available/app.mysys.shop.conf
```

Conteúdo:
```apache
<VirtualHost *:80>
    ServerName app.mysys.shop
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy para Frontend Next.js
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
    
    # Headers
    Header set X-Real-IP %{REMOTE_ADDR}s
    Header set X-Forwarded-For %{REMOTE_ADDR}s
    Header set X-Forwarded-Proto "http"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/app.mysys.shop-error.log
    CustomLog ${APACHE_LOG_DIR}/app.mysys.shop-access.log combined
</VirtualHost>
```

### Ativar novos sites
```bash
sudo a2ensite api.mysys.shop.conf
sudo a2ensite app.mysys.shop.conf
sudo systemctl restart apache2
```

## 4. Configurar Banco de Dados

```bash
# Limpar banco antigo (CUIDADO!)
sudo mysql -u root -p

# No MySQL:
DROP DATABASE IF EXISTS nome_banco_antigo;
CREATE DATABASE app_despesas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_despesas_user'@'localhost' IDENTIFIED BY 'senha-segura-aqui';
GRANT ALL PRIVILEGES ON app_despesas.* TO 'app_despesas_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Deploy da Aplicação

```bash
# Clonar repositório
cd /var/www
sudo git clone https://github.com/seu-usuario/app-despesas.git
cd app-despesas

# Dar permissões
sudo chown -R $USER:$USER /var/www/app-despesas

# Instalar dependências
npm install

# Copiar arquivos de produção
cp apps/api/.env.production apps/api/.env
cp apps/web/.env.production apps/web/.env

# Editar configurações
nano apps/api/.env
# Ajustar senha do banco e outras configs

# Build
npm run build

# Rodar migrações
cd apps/api
npm run migrate up
npm run seed run
cd ../..
```

## 6. Configurar PM2

```bash
# Criar arquivo ecosystem
nano /var/www/app-despesas/ecosystem.config.js
```

Conteúdo:
```javascript
module.exports = {
  apps: [
    {
      name: 'despesas-api',
      script: './apps/api/dist/index.js',
      cwd: '/var/www/app-despesas',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'despesas-web',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/app-despesas/apps/web',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

Iniciar:
```bash
cd /var/www/app-despesas
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 7. Configurar SSL com Certbot

```bash
# Instalar Certbot para Apache
sudo apt install -y certbot python3-certbot-apache

# Gerar certificados
sudo certbot --apache -d api.mysys.shop
sudo certbot --apache -d app.mysys.shop

# Testar renovação
sudo certbot renew --dry-run
```

## 8. Configurar Firewall (se houver)

```bash
# Permitir portas necessárias
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 9. Redirecionar domínio principal

```bash
sudo nano /etc/apache2/sites-available/mysys.shop.conf
```

Conteúdo:
```apache
<VirtualHost *:80>
    ServerName mysys.shop
    ServerAlias www.mysys.shop
    
    # Redirecionar para app
    RedirectPermanent / https://app.mysys.shop/
</VirtualHost>
```

Ativar:
```bash
sudo a2ensite mysys.shop.conf
sudo systemctl reload apache2
```

## 10. Verificar Tudo

```bash
# Status dos serviços
sudo systemctl status apache2
pm2 status

# Testar URLs
curl http://api.mysys.shop/health
curl http://app.mysys.shop

# Ver logs
pm2 logs
sudo tail -f /var/log/apache2/api.mysys.shop-error.log
```

## Rollback (se necessário)

Se algo der errado:
```bash
# Restaurar backup
sudo rm -rf /var/www/html/*
sudo cp -r /root/backup-multitenancy/html/* /var/www/html/

# Restaurar configurações Apache
sudo rm /etc/apache2/sites-available/*.conf
sudo cp -r /root/backup-multitenancy/sites-available/* /etc/apache2/sites-available/
sudo a2ensite seu-site-antigo.conf
sudo systemctl restart apache2
```