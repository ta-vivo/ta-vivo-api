import { Router } from 'express';
import IntegrationController from '../controllers/IntegrationController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/', verifyToken, IntegrationController.getAll);
router.post('/', verifyToken, IntegrationController.create);
router.post('/slack', verifyToken, IntegrationController.createSlack);
router.post('/discord', verifyToken, IntegrationController.createDiscord);
router.post('/request-email-code', verifyToken, IntegrationController.requestEmailConfirmation);
router.post('/test', verifyToken, IntegrationController.test);
router.put('/:id', verifyToken, IntegrationController.update);
router.delete('/:id', verifyToken, IntegrationController.delete);

export default router;