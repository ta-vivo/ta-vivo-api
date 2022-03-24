import express from 'express';
import userRoutes from '../routes/User';
import TaskRoutes from '../routes/Task';
import CheckRoutes from '../routes/Check';
import IntegrationRoutes from '../routes/Integration';
import Auth from '../routes/Auth';
import Dashboard from '../routes/Dashboard';
import Payment from '../routes/Payment';
import Pricing from '../routes/Pricing';

// Initialization
let router = express.Router();

// Routes
router.use('/users', userRoutes);
router.use('/tasks', TaskRoutes);
router.use('/checks', CheckRoutes);
router.use('/auth', Auth);
router.use('/integrations', IntegrationRoutes);
router.use('/dashboard', Dashboard);
router.use('/payments', Payment);
router.use('/pricing', Pricing);

export default router;