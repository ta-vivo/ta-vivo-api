import { Router } from 'express';
import PricingController from '../controllers/PricingController';

const router = Router();

router.get('/', PricingController.getAll);

export default router;