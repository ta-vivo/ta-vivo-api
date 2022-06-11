import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/google', AuthController.google);
router.post('/discord', AuthController.discord);
router.post('/slack', AuthController.slack);
router.post('/github', AuthController.github);
router.post('/register', AuthController.register);
router.get('/me', verifyToken, AuthController.me);
router.post('/register-email-confirmation', verifyToken, AuthController.registerEmailConfirmation);
router.get('/request-register-email-confirmation', verifyToken, AuthController.requestRegisterEmailConfirmation);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/recover-password', AuthController.recoverPassword);

export default router;