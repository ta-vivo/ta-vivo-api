import { Router } from 'express';
import UserController from '../controllers/UserController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.put('/', verifyToken, UserController.update);

export default router;