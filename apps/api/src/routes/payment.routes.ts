import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { auth } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

router.use(auth);
router.post('/checkout', paymentController.createCheckoutSession);
router.get('/subscription', paymentController.getSubscriptionInfo);

export { router as paymentRoutes };