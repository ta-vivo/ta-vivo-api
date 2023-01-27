import { Router } from 'express';
import StatusPageController from '../controllers/StatusPageController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/', verifyToken, StatusPageController.getAll);
router.get('/:uuid', verifyToken, StatusPageController.getById);
router.put('/:uuid', verifyToken, StatusPageController.update);
router.post('/', verifyToken, StatusPageController.create);
router.delete('/:uuid', verifyToken, StatusPageController.delete);

export default router;