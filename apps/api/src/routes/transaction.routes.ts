/**
 * Transaction Routes
 */

import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { requireActivePremium } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();
const transactionController = new TransactionController();

// Validation rules
const createTransactionValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('categoryId')
    .isUUID()
    .withMessage('Invalid category ID'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Description must be between 1 and 255 characters'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
];

const listTransactionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  query('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
];

// Routes
router.get('/', listTransactionsValidation, validateRequest, transactionController.list);
router.get('/summary', transactionController.summary);
router.get('/:id', transactionController.get);
router.post('/', createTransactionValidation, validateRequest, transactionController.create);
router.put('/:id', createTransactionValidation, validateRequest, transactionController.update);
router.delete('/:id', transactionController.delete);

// Premium routes
router.get('/export/pdf', requireActivePremium, transactionController.exportPDF);
router.get('/export/excel', requireActivePremium, transactionController.exportExcel);

export default router;