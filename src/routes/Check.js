import { Router } from 'express';
import CheckController from '../controllers/CheckController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/', verifyToken, CheckController.getAll);
router.get('/:id', verifyToken, CheckController.getById);
router.get('/:id/logs', verifyToken, CheckController.getLogsByCheckId);
router.get('/:id/logs/download', CheckController.downloadLogsByCheckId);
router.put('/:id', verifyToken, CheckController.update);
router.put('/:id/disable', verifyToken, CheckController.disable);
router.put('/:id/enable', verifyToken, CheckController.enable);
router.post('/', verifyToken, CheckController.create);
router.delete('/:id', verifyToken, CheckController.delete);

export default router;