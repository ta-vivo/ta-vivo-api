import { Router } from 'express';
import PaymentController from '../controllers/PaymentController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/paypal-request-token', verifyToken, PaymentController.paypalRequestToken);
router.get('/paypal-transactions', verifyToken, PaymentController.paypalTransactions);

router.post('/paypal-subscription', verifyToken, PaymentController.paypalSusbcription);
router.post('/paypal-subscription-cancel', verifyToken, PaymentController.paypalSusbcriptionCancel);

export default router;