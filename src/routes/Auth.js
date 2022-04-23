import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', verifyToken, AuthController.me);
router.post('/register-email-confirmation', verifyToken, AuthController.registerEmailConfirmation);
router.get('/request-register-email-confirmation', verifyToken, AuthController.requestRegisterEmailConfirmation);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);

export default router;