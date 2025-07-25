import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: errors
      });
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Nome deve ter pelo menos 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
      password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required().messages({
        'string.min': 'Senha deve ter pelo menos 6 caracteres',
        'string.pattern.base': 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
        'any.required': 'Senha é obrigatória'
      })
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
      password: Joi.string().required().messages({
        'any.required': 'Senha é obrigatória'
      })
    })
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token é obrigatório'
      })
    })
  },

  // Transaction schemas
  createTransaction: {
    body: Joi.object({
      amount: Joi.number().positive().precision(2).required().messages({
        'number.positive': 'Valor deve ser positivo',
        'number.precision': 'Valor deve ter no máximo 2 casas decimais',
        'any.required': 'Valor é obrigatório'
      }),
      description: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Descrição não pode estar vazia',
        'string.max': 'Descrição deve ter no máximo 200 caracteres',
        'any.required': 'Descrição é obrigatória'
      }),
      date: Joi.date().iso().required().messages({
        'date.format': 'Data deve estar no formato YYYY-MM-DD',
        'any.required': 'Data é obrigatória'
      }),
      type: Joi.string().valid('income', 'expense').required().messages({
        'any.only': 'Tipo deve ser "income" ou "expense"',
        'any.required': 'Tipo é obrigatório'
      }),
      categoryId: Joi.string().uuid().required().messages({
        'string.guid': 'ID da categoria deve ser um UUID válido',
        'any.required': 'ID da categoria é obrigatório'
      }),
      tags: Joi.array().items(Joi.string().max(50)).max(10).optional().messages({
        'array.max': 'Máximo de 10 tags permitidas',
        'string.max': 'Cada tag deve ter no máximo 50 caracteres'
      }),
      notes: Joi.string().max(500).optional().messages({
        'string.max': 'Notas devem ter no máximo 500 caracteres'
      }),
      installmentId: Joi.string().uuid().optional().messages({
        'string.guid': 'ID do parcelamento deve ser um UUID válido'
      }),
      subscriptionId: Joi.string().uuid().optional().messages({
        'string.guid': 'ID da assinatura deve ser um UUID válido'
      })
    })
  },

  updateTransaction: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'ID da transação deve ser um UUID válido',
        'any.required': 'ID da transação é obrigatório'
      })
    }),
    body: Joi.object({
      amount: Joi.number().positive().precision(2).optional().messages({
        'number.positive': 'Valor deve ser positivo',
        'number.precision': 'Valor deve ter no máximo 2 casas decimais'
      }),
      description: Joi.string().min(1).max(200).optional().messages({
        'string.min': 'Descrição não pode estar vazia',
        'string.max': 'Descrição deve ter no máximo 200 caracteres'
      }),
      date: Joi.date().iso().optional().messages({
        'date.format': 'Data deve estar no formato YYYY-MM-DD'
      }),
      categoryId: Joi.string().uuid().optional().messages({
        'string.guid': 'ID da categoria deve ser um UUID válido'
      }),
      tags: Joi.array().items(Joi.string().max(50)).max(10).optional().messages({
        'array.max': 'Máximo de 10 tags permitidas',
        'string.max': 'Cada tag deve ter no máximo 50 caracteres'
      }),
      notes: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Notas devem ter no máximo 500 caracteres'
      })
    }).min(1).messages({
      'object.min': 'Pelo menos um campo deve ser fornecido para atualização'
    })
  },

  deleteTransaction: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'ID da transação deve ser um UUID válido',
        'any.required': 'ID da transação é obrigatório'
      })
    })
  },

  getTransactions: {
    query: Joi.object({
      type: Joi.string().valid('income', 'expense').optional().messages({
        'any.only': 'Tipo deve ser "income" ou "expense"'
      }),
      categoryId: Joi.string().uuid().optional().messages({
        'string.guid': 'ID da categoria deve ser um UUID válido'
      }),
      startDate: Joi.date().iso().optional().messages({
        'date.format': 'Data inicial deve estar no formato YYYY-MM-DD'
      }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
        'date.format': 'Data final deve estar no formato YYYY-MM-DD',
        'date.min': 'Data final deve ser posterior à data inicial'
      }),
      search: Joi.string().max(100).optional().messages({
        'string.max': 'Busca deve ter no máximo 100 caracteres'
      }),
      page: Joi.number().integer().min(1).optional().messages({
        'number.integer': 'Página deve ser um número inteiro',
        'number.min': 'Página deve ser maior que 0'
      }),
      limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.integer': 'Limite deve ser um número inteiro',
        'number.min': 'Limite deve ser maior que 0',
        'number.max': 'Limite deve ser no máximo 100'
      })
    })
  }
};