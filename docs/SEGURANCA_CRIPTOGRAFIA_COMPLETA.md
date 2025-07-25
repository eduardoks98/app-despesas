# 🔐 SEGURANÇA E CRIPTOGRAFIA - Proteção Completa de Dados

## 🎯 Por que Criptografia é ESSENCIAL

### **💰 Dados Financeiros Sensíveis:**
- Transações bancárias dos usuários
- Valores de receitas e despesas
- Informações de categorização
- Padrões de gastos pessoais
- Dados familiares compartilhados

### **⚖️ Compliance Legal:**
- **LGPD** (Lei Geral de Proteção de Dados)
- **PCI DSS** (para processamento de pagamentos)
- **SOC 2** (para SaaS empresarial)
- Auditoria de segurança obrigatória

---

## 🛡️ NÍVEIS DE CRIPTOGRAFIA

### **🔒 Nível 1: Encryption at Rest (Dados em Repouso)**
```sql
-- MySQL com encryption nativa
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    -- Dados sensíveis criptografados
    amount_encrypted VARBINARY(255),
    description_encrypted VARBINARY(255),
    notes_encrypted VARBINARY(500),
    -- Metadata não sensível
    date DATETIME NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENCRYPTION='Y';

-- Chave de criptografia do banco
SET GLOBAL innodb_encryption_default_key_id = 1;
```

### **🔐 Nível 2: Application-Level Encryption**
```typescript
// apps/api/src/utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  // Chave derivada do usuário + master key
  private deriveUserKey(userId: string): Buffer {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    return crypto.pbkdf2Sync(
      userId, 
      masterKey, 
      100000, // 100k iterations
      this.keyLength, 
      'sha512'
    );
  }

  encryptSensitiveData(data: string, userId: string): string {
    const key = this.deriveUserKey(userId);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Retorna: iv + tag + encrypted data (tudo em hex)
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  decryptSensitiveData(encryptedData: string, userId: string): string {
    const key = this.deriveUserKey(userId);
    
    // Extrair IV, tag e dados
    const iv = Buffer.from(encryptedData.slice(0, this.ivLength * 2), 'hex');
    const tag = Buffer.from(encryptedData.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2), 'hex');
    const encrypted = encryptedData.slice((this.ivLength + this.tagLength) * 2);
    
    const decipher = crypto.createDecipher(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash para busca (permite pesquisa sem descriptografar)
  createSearchableHash(data: string): string {
    return crypto.createHash('sha256').update(data.toLowerCase()).digest('hex');
  }
}
```

### **🔗 Nível 3: Transport Layer Security (HTTPS)**
```nginx
# /etc/nginx/sites-available/app-despesas
server {
    listen 443 ssl http2;
    server_name sua-vps.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sua-vps.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sua-vps.com/privkey.pem;
    
    # Security headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_ssl_verify off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name sua-vps.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 💾 IMPLEMENTAÇÃO NO MODELO DE DADOS

### **🔒 Repository com Criptografia:**
```typescript
// apps/api/src/repositories/EncryptedTransactionRepository.ts
import { EncryptionService } from '../utils/encryption';
import { Database } from '../config/database';

export class EncryptedTransactionRepository {
  private encryption = new EncryptionService();
  private db = Database.getInstance();

  async createTransaction(transaction: CreateTransactionData, userId: string): Promise<void> {
    // Criptografar dados sensíveis
    const encryptedAmount = this.encryption.encryptSensitiveData(
      transaction.amount.toString(), 
      userId
    );
    const encryptedDescription = this.encryption.encryptSensitiveData(
      transaction.description, 
      userId
    );
    const encryptedNotes = transaction.notes ? 
      this.encryption.encryptSensitiveData(transaction.notes, userId) : null;

    // Hash para busca
    const descriptionHash = this.encryption.createSearchableHash(transaction.description);

    await this.db.query(`
      INSERT INTO transactions (
        id, user_id, 
        amount_encrypted, description_encrypted, notes_encrypted,
        description_hash, date, type, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transaction.id,
      userId,
      encryptedAmount,
      encryptedDescription,
      encryptedNotes,
      descriptionHash,
      transaction.date,
      transaction.type,
      transaction.categoryId
    ]);
  }

  async getTransactions(userId: string): Promise<DecryptedTransaction[]> {
    const rows = await this.db.query(`
      SELECT id, amount_encrypted, description_encrypted, notes_encrypted,
             date, type, category_id, created_at
      FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC
    `, [userId]);

    return rows.map(row => ({
      id: row.id,
      amount: parseFloat(this.encryption.decryptSensitiveData(row.amount_encrypted, userId)),
      description: this.encryption.decryptSensitiveData(row.description_encrypted, userId),
      notes: row.notes_encrypted ? 
        this.encryption.decryptSensitiveData(row.notes_encrypted, userId) : null,
      date: row.date,
      type: row.type,
      categoryId: row.category_id,
      createdAt: row.created_at
    }));
  }

  // Busca por hash (sem descriptografar todos os dados)
  async searchTransactions(userId: string, searchTerm: string): Promise<DecryptedTransaction[]> {
    const searchHash = this.encryption.createSearchableHash(searchTerm);
    
    const rows = await this.db.query(`
      SELECT id, amount_encrypted, description_encrypted, notes_encrypted,
             date, type, category_id, created_at
      FROM transactions 
      WHERE user_id = ? AND description_hash = ?
      ORDER BY date DESC
    `, [userId, searchHash]);

    return rows.map(row => ({
      id: row.id,
      amount: parseFloat(this.encryption.decryptSensitiveData(row.amount_encrypted, userId)),
      description: this.encryption.decryptSensitiveData(row.description_encrypted, userId),
      notes: row.notes_encrypted ? 
        this.encryption.decryptSensitiveData(row.notes_encrypted, userId) : null,
      date: row.date,
      type: row.type,
      categoryId: row.category_id,
      createdAt: row.created_at
    }));
  }
}
```

---

## 🔑 GERENCIAMENTO DE CHAVES

### **🎯 Estratégia de Chaves:**
```typescript
// apps/api/src/config/keys.ts
export class KeyManager {
  // Master key (nunca muda, armazenada em variável de ambiente)
  private static readonly MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY!;
  
  // Chave por usuário (derivada do master key + user ID)
  static getUserKey(userId: string): string {
    return crypto.pbkdf2Sync(
      userId,
      this.MASTER_KEY,
      100000, // iterations
      32,     // key length
      'sha512'
    ).toString('hex');
  }

  // Rotação de chaves (para usuários premium)
  static async rotateUserKey(userId: string): Promise<void> {
    const oldKey = this.getUserKey(userId);
    const newKeyDate = new Date().toISOString();
    const newKey = crypto.pbkdf2Sync(
      userId + newKeyDate,
      this.MASTER_KEY,
      100000,
      32,
      'sha512'
    ).toString('hex');

    // Descriptografar com chave antiga e criptografar com nova
    await this.reencryptUserData(userId, oldKey, newKey);
    
    // Salvar timestamp da rotação
    await Database.getInstance().query(
      'UPDATE users SET key_rotation_date = ? WHERE id = ?',
      [newKeyDate, userId]
    );
  }

  private static async reencryptUserData(userId: string, oldKey: string, newKey: string): Promise<void> {
    // Implementar re-criptografia de todos os dados do usuário
    // Este processo deve ser executado em background
  }
}
```

### **🔐 Variáveis de Ambiente Seguras:**
```bash
# apps/api/.env
# Chave mestra (256 bits em hex)
MASTER_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Configuração de criptografia
ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_DERIVATION_ITERATIONS=100000
HASH_ALGORITHM=sha512

# Rotação automática de chaves
KEY_ROTATION_INTERVAL_DAYS=90
AUTO_KEY_ROTATION_ENABLED=true
```

---

## 🛡️ SEGURANÇA DA API

### **🔒 Middleware de Segurança:**
```typescript
// apps/api/src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  // Headers de segurança
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting agressivo para dados sensíveis
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: { error: 'Too many requests from this IP' },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Log de tentativas suspeitas
  (req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
      'SELECT', 'DROP', 'INSERT', 'UPDATE', 'DELETE',
      '<script>', 'javascript:', 'eval(', 'alert('
    ];

    const requestData = JSON.stringify(req.body).toLowerCase();
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      requestData.includes(pattern.toLowerCase())
    );

    if (hasSuspiciousContent) {
      console.error('🚨 SUSPICIOUS REQUEST:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({ error: 'Invalid request format' });
    }

    next();
  }
];
```

### **🔍 Auditoria e Logs:**
```typescript
// apps/api/src/middleware/audit.ts
export class AuditLogger {
  static async logDataAccess(userId: string, action: string, dataType: string, req: Request): Promise<void> {
    await Database.getInstance().query(`
      INSERT INTO audit_logs (
        id, user_id, action, data_type, ip_address, 
        user_agent, timestamp, request_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      userId,
      action,
      dataType,
      req.ip,
      req.get('User-Agent'),
      new Date(),
      crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')
    ]);
  }

  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    // Detectar:
    // - Múltiplos IPs em pouco tempo
    // - Muitas requests de dados sensíveis
    // - Tentativas de acesso fora do horário normal
    
    const recentActivity = await Database.getInstance().query(`
      SELECT COUNT(*) as count, COUNT(DISTINCT ip_address) as unique_ips
      FROM audit_logs 
      WHERE user_id = ? AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [userId]);

    const { count, unique_ips } = recentActivity[0];
    
    // Mais de 100 requests em 1 hora ou mais de 3 IPs diferentes
    return count > 100 || unique_ips > 3;
  }
}
```

---

## 📱 SEGURANÇA NO MOBILE

### **🔐 Armazenamento Local Seguro:**
```typescript
// apps/mobile/src/services/SecureStorage.ts
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

export class SecureStorageService {
  private static readonly KEY_PREFIX = 'app_despesas_';
  
  // Criptografar antes de salvar
  static async setSecureItem(key: string, value: string): Promise<void> {
    const deviceKey = await this.getDeviceKey();
    const encrypted = CryptoJS.AES.encrypt(value, deviceKey).toString();
    
    await SecureStore.setItemAsync(
      this.KEY_PREFIX + key, 
      encrypted,
      {
        requireAuthentication: true, // Require biometrics/PIN
        authenticationPrompt: 'Authenticate to access your financial data'
      }
    );
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      const encrypted = await SecureStore.getItemAsync(this.KEY_PREFIX + key);
      if (!encrypted) return null;
      
      const deviceKey = await this.getDeviceKey();
      const decrypted = CryptoJS.AES.decrypt(encrypted, deviceKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt secure item:', error);
      return null;
    }
  }

  private static async getDeviceKey(): Promise<string> {
    let deviceKey = await SecureStore.getItemAsync('device_encryption_key');
    
    if (!deviceKey) {
      // Gerar chave única por dispositivo
      deviceKey = CryptoJS.lib.WordArray.random(256/8).toString();
      await SecureStore.setItemAsync('device_encryption_key', deviceKey);
    }
    
    return deviceKey;
  }

  // Limpar todos os dados em caso de logout
  static async clearAllSecureData(): Promise<void> {
    const keys = ['auth_token', 'user_data', 'sync_data', 'premium_status'];
    
    for (const key of keys) {
      await SecureStore.deleteItemAsync(this.KEY_PREFIX + key);
    }
  }
}
```

---

## 🔍 COMPLIANCE E AUDITORIA

### **📋 Checklist LGPD:**
```typescript
// apps/api/src/services/LGPDService.ts
export class LGPDComplianceService {
  // Direito de acesso (Art. 15)
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const userData = {
      personalInfo: await this.getUserPersonalInfo(userId),
      transactions: await this.getDecryptedTransactions(userId),
      categories: await this.getUserCategories(userId),
      auditLogs: await this.getUserAuditLogs(userId),
      dataProcessingHistory: await this.getDataProcessingHistory(userId)
    };

    return {
      exportDate: new Date().toISOString(),
      format: 'JSON',
      data: userData,
      signature: this.signExport(userData) // Assinatura digital
    };
  }

  // Direito de retificação (Art. 16)
  static async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
    await this.logDataModification(userId, 'data_rectification', updates);
    // Implementar atualização com criptografia
  }

  // Direito de eliminação (Art. 18)
  static async deleteUserData(userId: string): Promise<void> {
    await Database.getInstance().transaction(async (connection) => {
      // 1. Log da eliminação
      await this.logDataDeletion(userId);
      
      // 2. Deletar dados criptografados
      await connection.execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM categories WHERE user_id = ? AND is_system = false', [userId]);
      
      // 3. Anonimizar logs de auditoria (manter por 5 anos)
      await connection.execute(
        'UPDATE audit_logs SET user_id = ?, ip_address = ? WHERE user_id = ?',
        ['ANONYMIZED', '0.0.0.0', userId]
      );
      
      // 4. Deletar usuário
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    });
  }

  // Relatório de conformidade
  static async generateComplianceReport(): Promise<ComplianceReport> {
    return {
      encryptionStatus: await this.checkEncryptionCompliance(),
      accessLogs: await this.getAccessLogsSummary(),
      dataRetention: await this.checkDataRetentionCompliance(),
      userRights: await this.getUserRightsExercised(),
      securityIncidents: await this.getSecurityIncidents(),
      generatedAt: new Date().toISOString()
    };
  }
}
```

### **🛡️ Certificações de Segurança:**
```bash
# Certificações recomendadas para SaaS financeiro:
✅ ISO 27001 (Gestão de Segurança da Informação)
✅ SOC 2 Type II (Auditoria de controles de segurança)  
✅ PCI DSS Level 1 (Stripe cuida disso para pagamentos)
✅ LGPD Compliance (Lei brasileira)

# Ferramentas de auditoria:
- OWASP ZAP (teste de penetração)
- Nessus (vulnerability scanner)
- Qualys SSL Labs (teste SSL)
- SecurityHeaders.com (verificar headers)
```

---

## 🚨 PLANO DE RESPOSTA A INCIDENTES

### **⚠️ Procedimentos de Emergência:**
```typescript
// apps/api/src/services/IncidentResponse.ts
export class IncidentResponseService {
  static async handleSecurityBreach(incidentType: string, details: any): Promise<void> {
    // 1. Log imediato do incidente
    await this.logSecurityIncident(incidentType, details);
    
    // 2. Notificar administradores
    await this.notifyAdmins(incidentType, details);
    
    // 3. Medidas de contenção automáticas
    switch (incidentType) {
      case 'data_breach':
        await this.freezeAffectedAccounts(details.affectedUsers);
        await this.rotateSystemKeys();
        break;
        
      case 'brute_force_attack':
        await this.blockSuspiciousIPs(details.attackerIPs);
        await this.enableEnhancedLogging();
        break;
        
      case 'unauthorized_access':
        await this.invalidateAllTokens(details.userId);
        await this.requirePasswordReset(details.userId);
        break;
    }
    
    // 4. Notificar usuários afetados (LGPD exige em 72h)
    await this.scheduleUserNotification(details.affectedUsers);
  }

  // Notificação obrigatória LGPD
  static async notifyANPD(incidentDetails: SecurityIncident): Promise<void> {
    // Implementar notificação à ANPD se necessário
    // (vazamento de dados pessoais sensíveis)
  }
}
```

---

## 💰 CUSTOS DE IMPLEMENTAÇÃO

### **💸 Investimento em Segurança:**
```bash
# Desenvolvimento:
Implementação de criptografia:     R$ 2.000-5.000 (uma vez)
Auditoria de segurança:           R$ 3.000-8.000 (anual)
Certificação ISO 27001:           R$ 15.000-30.000 (uma vez)
SOC 2 Type II:                    R$ 10.000-25.000 (anual)

# Operacionais:
SSL Certificate (wildcard):       R$ 500/ano
Monitoring tools:                 R$ 100-300/mês
Backup encryption:                R$ 50-100/mês
Security scanning:                R$ 200-500/mês

# Total anual: R$ 25.000-70.000
# ROI: Confiança dos clientes premium = +40% conversão
```

### **📈 Valor para o Negócio:**
- **Confiança**: Clientes pagam mais por segurança
- **Compliance**: Evita multas LGPD (até 2% do faturamento)
- **Seguro**: Reduz risco de vazamentos custosos
- **Marketing**: "Bank-level security" como diferencial

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Esta Semana:**
1. ✅ Implementar criptografia básica na API
2. ✅ Configurar HTTPS com SSL forte
3. ✅ Adicionar headers de segurança
4. ✅ Implementar audit logging

### **Próxima Semana:**
1. 🔄 Criptografia no banco de dados
2. 🔄 Secure storage no mobile
3. 🔄 Middleware de detecção de ataques
4. 🔄 Testes de penetração básicos

### **Próximo Mês:**
1. 📋 Auditoria externa de segurança
2. 📋 Documentação de compliance LGPD
3. 📋 Plano de resposta a incidentes
4. 📋 Certificações de segurança

---

**🔐 Com essa implementação, seus clientes premium terão segurança de nível bancário, essencial para um SaaS financeiro de sucesso!**

_A segurança não é opcional em aplicações financeiras - é o que diferencia um produto amador de um profissional._