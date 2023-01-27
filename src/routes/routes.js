import express from 'express';
import CheckRoutes from '../routes/Check';
import IntegrationRoutes from '../routes/Integration';
import Auth from '../routes/Auth';
import Dashboard from '../routes/Dashboard';
import Payment from '../routes/Payment';
import Pricing from '../routes/Pricing';
import User from '../routes/User';
import StatusPage from '../routes/StatusPage';

// Initialization
let router = express.Router();

// Routes
router.use('/checks', CheckRoutes);
router.use('/auth', Auth);
router.use('/integrations', IntegrationRoutes);
router.use('/dashboard', Dashboard);
router.use('/payments', Payment);
router.use('/pricing', Pricing);
router.use('/users', User);
router.use('/status-pages', StatusPage);

export default router;