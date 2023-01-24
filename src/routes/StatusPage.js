import { Router } from 'express';
import StatusPageController from '../controllers/StatusPageController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/', verifyToken, StatusPageController.getAll);
router.get('/:id', verifyToken, StatusPageController.getById);
router.put('/:id', verifyToken, StatusPageController.update);
router.post('/', verifyToken, StatusPageController.create);
router.delete('/:id', verifyToken, StatusPageController.delete);

export default router;