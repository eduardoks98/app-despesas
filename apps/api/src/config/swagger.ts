import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
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