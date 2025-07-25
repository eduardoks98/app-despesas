# 📚 DOCUMENTAÇÃO DA API - Swagger/OpenAPI

## 🎯 EQUIVALENTE AO SWAGGER DO PHP

No PHP você usa Swagger, no Node.js usamos **Swagger/OpenAPI** também! A diferença é só na implementação:

### **PHP (que você conhece):**
```php
/**
 * @OA\Post(
 *     path="/api/login",
 *     summary="Login do usuário",
 *     @OA\Response(response="200", description="Login realizado")
 * )
 */
```

### **Node.js (equivalente):**
```typescript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login do usuário
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login realizado
 */
```

---

## 🚀 IMPLEMENTAÇÃO COMPLETA

### **1. 📦 Dependências Necessárias**

```bash
# Na pasta apps/api:
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

### **2. 📄 Configuração Swagger (apps/api/src/config/swagger.ts)**

```typescript
import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MySys App Despesas API',
    version: '1.0.0',
    description: `
      API para controle financeiro pessoal e familiar.
      
      ## 🚀 Recursos
      - **Autenticação JWT** com refresh tokens
      - **Modelo Freemium** (local + premium na nuvem) 
      - **Contas Familiares** para usuários premium
      - **Criptografia** de dados sensíveis
      - **Rate Limiting** e segurança avançada
      
      ## 📱 Versões
      - **Gratuita:** Dados locais SQLite no mobile
      - **Premium:** Sincronização MySQL + Web App + Família
      
      ## 🔐 Autenticação
      Use o endpoint \`/auth/login\` para obter o token JWT.
      Inclua o token no header: \`Authorization: Bearer {token}\`
    `,
    contact: {
      name: 'MySys Support',
      email: 'suporte@mysys.shop',
      url: 'https://mysys.shop'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://api.mysys.shop',
      description: 'Servidor de Produção'
    },
    {
      url: 'http://localhost:3001',
      description: 'Servidor de Desenvolvimento'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via /auth/login'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único do usuário'
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nome completo do usuário'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email único do usuário'
          },
          isPremium: {
            type: 'boolean',
            description: 'Indica se o usuário tem plano premium'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação da conta'
          }
        }
      },
      Transaction: {
        type: 'object',
        required: ['id', 'description', 'amount', 'type', 'categoryId'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único da transação'
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Descrição da transação'
          },
          amount: {
            type: 'number',
            multipleOf: 0.01,
            minimum: 0,
            description: 'Valor da transação (sempre positivo)'
          },
          type: {
            type: 'string',
            enum: ['income', 'expense'],
            description: 'Tipo da transação'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'ID da categoria'
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Data da transação (YYYY-MM-DD)'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID do usuário proprietário'
          }
        }
      },
      Category: {
        type: 'object',
        required: ['id', 'name', 'type'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 50
          },
          type: {
            type: 'string',
            enum: ['income', 'expense']
          },
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Cor em formato hexadecimal'
          },
          icon: {
            type: 'string',
            description: 'Nome do ícone'
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Código do erro'
          },
          message: {
            type: 'string',
            description: 'Mensagem descritiva do erro'
          },
          details: {
            type: 'object',
            description: 'Detalhes adicionais do erro'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          password: {
            type: 'string',
            minLength: 6
          }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'user'],
        properties: {
          accessToken: {
            type: 'string',
            description: 'Token JWT para autenticação'
          },
          refreshToken: {
            type: 'string',
            description: 'Token para renovar o accessToken'
          },
          user: {
            $ref: '#/components/schemas/User'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Token de acesso inválido ou expirado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'UNAUTHORIZED',
              message: 'Token inválido ou expirado'
            }
          }
        }
      },
      PremiumRequired: {
        description: 'Recurso disponível apenas para usuários premium',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'PREMIUM_REQUIRED',
              message: 'Este recurso está disponível apenas para usuários premium'
            }
          }
        }
      },
      ValidationError: {
        description: 'Erro de validação dos dados enviados',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'VALIDATION_ERROR',
              message: 'Dados inválidos',
              details: {
                email: 'Email é obrigatório',
                password: 'Senha deve ter pelo menos 6 caracteres'
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Status da API'
    },
    {
      name: 'Auth',
      description: 'Autenticação e autorização'
    },
    {
      name: 'Transactions',
      description: 'Gestão de transações financeiras'
    },
    {
      name: 'Categories',
      description: 'Categorias de transações'
    },
    {
      name: 'Premium',
      description: 'Recursos exclusivos para usuários premium'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/middleware/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
```

### **3. 🖥️ Servidor com Swagger UI (apps/api/src/server.ts)**

```typescript
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MySys App Despesas API',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #667eea; }
  `,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true
  }
}));

// JSON da documentação (para integração com outras ferramentas)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Suas rotas da API
app.use('/api', authRoutes);
app.use('/api', transactionRoutes);

export default app;
```

### **4. 📝 Documentando Endpoints (apps/api/src/controllers/auth.controller.ts)**

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: usuario@exemplo.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: senha123
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     description: Realiza login e retorna tokens JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: João Silva
 *                 email: joao@exemplo.com
 *                 isPremium: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: INVALID_CREDENTIALS
 *               message: Email ou senha incorretos
 */
export const login = async (req: Request, res: Response) => {
  // Implementação do login...
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria uma nova conta de usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Maria Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@exemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: EMAIL_ALREADY_EXISTS
 *               message: Este email já está cadastrado
 */
export const register = async (req: Request, res: Response) => {
  // Implementação do registro...
};
```

### **5. 💰 Endpoints Premium (apps/api/src/controllers/transaction.controller.ts)**

```typescript
/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Listar transações
 *     description: Lista transações do usuário (requer autenticação)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página dos resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filtrar por tipo de transação
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Criar transação
 *     description: Cria uma nova transação (requer premium para sync)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - type
 *               - categoryId
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: Compra no supermercado
 *               amount:
 *                 type: number
 *                 multipleOf: 0.01
 *                 minimum: 0
 *                 example: 85.50
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-15
 *     responses:
 *       201:
 *         description: Transação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         $ref: '#/components/responses/PremiumRequired'
 */

/**
 * @swagger
 * /sync/transactions:
 *   post:
 *     summary: Sincronizar transações
 *     description: Sincroniza transações locais com a nuvem (apenas premium)
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Transaction'
 *               lastSyncDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data da última sincronização
 *     responses:
 *       200:
 *         description: Sincronização realizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 syncedTransactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 lastSyncDate:
 *                   type: string
 *                   format: date-time
 *                 conflicts:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         $ref: '#/components/responses/PremiumRequired'
 */
```

---

## 🌐 URLS DA DOCUMENTAÇÃO

### **🔗 Acessar a Documentação:**

```bash
# Desenvolvimento:
http://localhost:3001/api-docs

# Produção:
https://api.mysys.shop/api-docs

# JSON da spec (para integração):
https://api.mysys.shop/api-docs.json
```

---

## 🎨 CUSTOMIZAÇÃO AVANÇADA

### **🎯 Temas e Personalização:**

```typescript
// No servidor, customize o Swagger UI:
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MySys App Despesas API',
  customfavIcon: '/favicon.ico',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { 
      color: #667eea; 
      font-size: 2.5rem;
    }
    .swagger-ui .scheme-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
    }
    .swagger-ui .info .description {
      font-size: 1.1rem;
      line-height: 1.6;
    }
  `,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
}));
```

---

## 🚀 DEPLOY DA DOCUMENTAÇÃO

### **📦 Apache Configuration (docs.mysys.shop):**

```apache
# Já configurado no apache-mysys-shop.conf
<VirtualHost *:443>
    ServerName docs.mysys.shop
    DocumentRoot /var/www/app-despesas/docs
    
    # Proxy para a documentação da API
    ProxyPass /api-docs http://localhost:3001/api-docs
    ProxyPassReverse /api-docs http://localhost:3001/api-docs
    
    # Servir documentação estática se houver
    <Directory /var/www/app-despesas/docs>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### **📋 Script de Build com Docs:**

```bash
# No deploy-apache-mysys.sh, adicionar:
log "📚 Gerando documentação da API..."

cd $API_DIR
npm run docs:generate  # Gerar docs estáticos se quiser

# Criar página de índice da documentação
cat > $PROJECT_DIR/docs/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>MySys - Documentação</title>
    <meta http-equiv="refresh" content="0; url=/api-docs">
</head>
<body>
    <h1>Redirecionando para a documentação da API...</h1>
    <a href="/api-docs">Clique aqui se não foi redirecionado</a>
</body>
</html>
EOF
```

---

## 💡 VANTAGENS DO SWAGGER NO NODE.JS

### **✅ Benefícios:**

1. **Mesma funcionalidade do PHP:** Interface visual, testes, schemas
2. **TypeScript integration:** Tipagem automática
3. **Live reload:** Atualiza automaticamente durante desenvolvimento  
4. **JWT testing:** Testador de autenticação integrado
5. **Export formats:** JSON, YAML, Postman collections

### **🔄 Workflow de Desenvolvimento:**

```bash
# 1. Desenvolver endpoint
# 2. Adicionar comentários @swagger
# 3. Testar no /api-docs
# 4. Exportar para Postman/Insomnia se necessário
```

---

## 🎯 RESULTADO FINAL

Você terá uma documentação automática igual ao Swagger do PHP, mas integrada ao seu projeto Node.js/TypeScript, acessível em:

**https://docs.mysys.shop/api-docs**

Com todas as funcionalidades que você já conhece do PHP! 🚀