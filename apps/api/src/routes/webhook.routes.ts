import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

router.post('/stripe', paymentController.handleWebhook);

export { router as webhookRoutes };