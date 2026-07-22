import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes';
import adminStatsRoutes from './adminStatsRoutes';

const router = Router();

router.use('/auth', adminAuthRoutes);
router.use('/stats', adminStatsRoutes);

export default router;
