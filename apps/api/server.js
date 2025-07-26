const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://app.mysys.shop', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'app_despesas_user',
  password: process.env.DB_PASSWORD || 'U5#4h#h4',
  database: process.env.DB_NAME || 'app_despesas',
  port: parseInt(process.env.DB_PORT) || 3306,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

let pool;
let isDbConnected = false;

// Initialize database connection
async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    isDbConnected = true;
    console.log('✅ Conectado ao banco de dados MySQL');
    console.log(`📊 Configuração: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    isDbConnected = false;
  }
}

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: "App Despesas - Personal Financial Management API v1.0",
    status: "online",
    timestamp: new Date().toISOString(),
    database: isDbConnected ? "connected" : "not connected - testing mode",
    environment: process.env.NODE_ENV || 'development',
    features: {
      mobile: "Free tier with basic transaction management",
      web: "Premium tier with advanced analytics"
    }
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        status: 'error',
        message: 'Database not connected'
      });
    }

    const connection = await pool.getConnection();
    await connection.execute('SELECT 1 as health_check');
    connection.release();

    res.json({
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    });
  }
});

// Register endpoint
app.post('/auth/register', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não conectado. Tente novamente mais tarde.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    if (typeof name !== 'string' || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nome deve ter pelo menos 2 caracteres',
        code: 'INVALID_NAME'
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 8 caracteres',
        code: 'INVALID_PASSWORD'
      });
    }

    // Verificar se usuário já existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Usuário já existe com este email',
        code: 'USER_EXISTS'
      });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir novo usuário
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const userId = result.insertId;

    console.log(`✅ Novo usuário registrado: ${email} (ID: ${userId})`);

    // Retornar sucesso (sem dados sensíveis)
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase()
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    
    // Log detalhado para debug (sem expor ao cliente)
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não conectado. Tente novamente mais tarde.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário  
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, is_premium, is_admin FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    const user = users[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({
        success: false,
        message: 'Configuração do servidor incompleta'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isPremium: Boolean(user.is_premium),
        isAdmin: Boolean(user.is_admin)
      },
      jwtSecret,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'app-despesas',
        audience: 'app-despesas-users'
      }
    );

    console.log(`✅ Login realizado: ${email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isPremium: Boolean(user.is_premium),
          isAdmin: Boolean(user.is_admin)
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware de autenticação JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret);
    
    // Buscar usuário atualizado
    const [users] = await pool.execute(
      'SELECT id, name, email, is_premium, is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    req.user = users[0];
    next();

  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Endpoint protegido - perfil do usuário
app.get('/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      isPremium: Boolean(req.user.is_premium),
      isAdmin: Boolean(req.user.is_admin)
    }
  });
});

// Endpoint para listar usuários (admin only)
app.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores.'
      });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, is_premium, is_admin, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Start server
async function startServer() {
  await initDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 API URL: http://localhost:${PORT}`);
    console.log(`🌐 Public URL: http://api.mysys.shop`);
    console.log(`📊 Database: ${isDbConnected ? 'Conectado' : 'Desconectado'}`);
    console.log('📝 Endpoints disponíveis:');
    console.log('   GET  /           - Health check');
    console.log('   GET  /health/db  - Database health');
    console.log('   POST /auth/register - Registro de usuário');
    console.log('   POST /auth/login    - Login de usuário');
    console.log('   GET  /auth/profile  - Perfil do usuário (auth)');
    console.log('   GET  /admin/users   - Listar usuários (admin)');
  });
}

startServer().catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});