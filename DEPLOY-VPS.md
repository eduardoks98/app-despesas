# Guia de Deploy para VPS - App Despesas

## Estrutura de Domínios

- **Frontend (Web)**: https://app.mysys.shop
- **API (Backend)**: https://api.mysys.shop
- **Site Principal**: https://mysys.shop (opcional)

## Pré-requisitos na VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

## 1. Configurar Banco de Dados

```bash
# Acessar MySQL
sudo mysql

# Criar banco e usuário
CREATE DATABASE app_despesas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_despesas_user'@'localhost' IDENTIFIED BY 'sua-senha-segura';
GRANT ALL PRIVILEGES ON app_despesas.* TO 'app_despesas_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2. Preparar Aplicação

```bash
# Criar diretório
sudo mkdir -p /var/www/app-despesas
sudo chown -R $USER:$USER /var/www/app-despesas

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/app-despesas.git
cd app-despesas

# Instalar dependências
npm install

# Build das aplicações
npm run build

# Copiar arquivo de produção
cp apps/api/.env.production apps/api/.env
# Editar .env com as senhas corretas
nano apps/api/.env

# Rodar migrações
cd apps/api
npm run migrate up
npm run seed run
```

## 3. Configurar PM2

Criar arquivo `/var/www/app-despesas/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'app-despesas-api',
      script: './apps/api/dist/index.js',
      cwd: '/var/www/app-despesas',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    },
    {
      name: 'app-despesas-web',
      script: './apps/web/.next/standalone/apps/web/server.js',
      cwd: '/var/www/app-despesas',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true
    }
  ]
};
```

Iniciar aplicações:

```bash
cd /var/www/app-despesas
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Configurar Nginx

### API (api.mysys.shop)

Criar `/etc/nginx/sites-available/api.mysys.shop`:

```nginx
server {
    listen 80;
    server_name api.mysys.shop;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Frontend (app.mysys.shop)

Criar `/etc/nginx/sites-available/app.mysys.shop`:

```nginx
server {
    listen 80;
    server_name app.mysys.shop;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar sites:

```bash
sudo ln -s /etc/nginx/sites-available/api.mysys.shop /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app.mysys.shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Configurar SSL

```bash
# Gerar certificados SSL
sudo certbot --nginx -d api.mysys.shop
sudo certbot --nginx -d app.mysys.shop

# Renovação automática
sudo certbot renew --dry-run
```

## 6. Configurar Email (Opcional)

Para usar email com seu domínio, você precisa:

1. Configurar registros MX no DNS
2. Usar um servidor SMTP (ex: Mailgun, SendGrid, ou instalar Postfix)

### Opção 1: SendGrid (Recomendado)
```env
EMAIL_FROM=noreply@mysys.shop
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=sua-api-key-sendgrid
```

### Opção 2: Postfix (Gratuito)
```bash
sudo apt install postfix
# Configurar como "Internet Site"
# Domínio: mysys.shop
```

## 7. Monitoramento

```bash
# Ver logs
pm2 logs

# Monitorar processos
pm2 monit

# Status
pm2 status

# Reiniciar aplicação
pm2 restart app-despesas-api
pm2 restart app-despesas-web
```

## DNS - Configurar no seu provedor de domínio

```
# Registros A
app.mysys.shop    A    IP-DA-SUA-VPS
api.mysys.shop    A    IP-DA-SUA-VPS

# Registro MX (para email)
mysys.shop    MX    10 mail.mysys.shop
```

## Backup Automático

Criar script `/home/usuario/backup-despesas.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/usuario/backups"
mkdir -p $BACKUP_DIR

# Backup banco de dados
mysqldump -u app_despesas_user -p'sua-senha' app_despesas > $BACKUP_DIR/db_$DATE.sql

# Compactar
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR db_$DATE.sql

# Limpar arquivo temporário
rm $BACKUP_DIR/db_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

Agendar no cron:
```bash
crontab -e
# Adicionar linha:
0 2 * * * /home/usuario/backup-despesas.sh
```