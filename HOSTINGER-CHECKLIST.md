# Checklist Rápido - VPS Hostinger

## Antes de Começar
- [ ] Fazer backup completo da VPS
- [ ] Anotar configurações importantes do sistema antigo
- [ ] Ter acesso SSH root à VPS

## Executar Reset

### 1. Upload do script
```bash
# Na sua máquina local
scp reset-vps-hostinger.sh root@seu-ip-vps:/tmp/

# Na VPS
ssh root@seu-ip-vps
chmod +x /tmp/reset-vps-hostinger.sh
/tmp/reset-vps-hostinger.sh
```

### 2. Após o script, fazer deploy manual
```bash
cd /var/www
git clone https://github.com/seu-usuario/app-despesas.git
cd app-despesas
npm install
```

### 3. Configurar arquivos .env
```bash
# API
cp apps/api/.env.production apps/api/.env
nano apps/api/.env
# Ajustar DB_PASSWORD com a senha criada no script

# Web
cp apps/web/.env.production apps/web/.env
```

### 4. Build e Deploy
```bash
npm run build
cd apps/api
npm run migrate up
npm run seed run
cd ../..
```

### 5. PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. SSL
```bash
sudo certbot --apache -d api.mysys.shop -d app.mysys.shop
```

## Verificação Final

- [ ] `http://api.mysys.shop/health` retorna OK
- [ ] `http://app.mysys.shop` carrega a aplicação
- [ ] `https://` funciona (após SSL)
- [ ] PM2 mostra processos rodando: `pm2 status`
- [ ] Logs sem erros: `pm2 logs`

## Problemas Comuns

### Apache não inicia
```bash
# Verificar erros
sudo apache2ctl configtest
sudo journalctl -xe
```

### Node.js não encontrado
```bash
# Reinstalar
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Porta já em uso
```bash
# Verificar portas
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# Matar processo se necessário
sudo kill -9 PID
```

### Banco de dados - erro de conexão
```bash
# Verificar MySQL
sudo systemctl status mysql
sudo mysql -u app_despesas_user -p

# Se der erro, recriar usuário
sudo mysql -u root -p
CREATE USER 'app_despesas_user'@'localhost' IDENTIFIED BY 'nova-senha';
GRANT ALL ON app_despesas.* TO 'app_despesas_user'@'localhost';
FLUSH PRIVILEGES;
```

## Rollback de Emergência

Se tudo der errado:
```bash
# Restaurar backup (ajustar data)
sudo rm -rf /var/www/html/*
sudo cp -r /root/backup-multitenancy-20240125/* /
sudo systemctl restart apache2
```