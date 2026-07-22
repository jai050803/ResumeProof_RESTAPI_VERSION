import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes';
import adminStatsRoutes from './adminStatsRoutes';
import adminClientsRoutes from './adminClientsRoutes';

const router = Router();

router.use('/auth', adminAuthRoutes);
router.use('/stats', adminStatsRoutes);
router.use('/clients', adminClientsRoutes);

export default router;
