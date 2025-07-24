#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando backup do App Despesas...');

// Função para criar backup
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Criar diretório de backup se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Dados para backup
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      app: 'App Despesas',
      data: {
        // Aqui você pode adicionar dados específicos se necessário
        config: {
          name: 'App Despesas',
          version: '1.0.0',
          build: timestamp
        }
      }
    };

    // Salvar backup
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup criado com sucesso: ${backupFile}`);
    console.log(`📁 Local: ${backupDir}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    process.exit(1);
  }
}

// Função para listar backups
function listBackups() {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Nenhum backup encontrado');
    return;
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .reverse();

  console.log('📋 Backups disponíveis:');
  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    console.log(`${index + 1}. ${file} (${stats.size} bytes) - ${stats.mtime.toLocaleString()}`);
  });
}

// Função para limpar backups antigos
function cleanOldBackups(daysToKeep = 30) {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Nenhum backup para limpar');
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json'));

  let deletedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removido: ${file}`);
      deletedCount++;
    }
  });

  console.log(`✅ ${deletedCount} backups antigos removidos`);
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
  case undefined:
    createBackup();
    break;
    
  case 'list':
    listBackups();
    break;
    
  case 'clean':
    const days = parseInt(args[1]) || 30;
    cleanOldBackups(days);
    break;
    
  case 'help':
    console.log(`
📱 App Despesas - Script de Backup

Uso: npm run backup [comando]

Comandos:
  create    Criar novo backup (padrão)
  list      Listar backups disponíveis
  clean     Limpar backups antigos (padrão: 30 dias)
  help      Mostrar esta ajuda

Exemplos:
  npm run backup
  npm run backup list
  npm run backup clean 7
    `);
    break;
    
  default:
    console.log('❌ Comando inválido. Use "npm run backup help" para ver as opções.');
    process.exit(1);
} 