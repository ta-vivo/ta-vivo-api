import { Router } from 'express';
import PaymentController from '../controllers/PaymentController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/paypal-request-token', verifyToken, PaymentController.paypalRequestToken);
router.post('/paypal-subscription', verifyToken, PaymentController.paypalSusbcription);

export default router;