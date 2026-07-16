import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import keyRoutes from './keyRoutes';
import settingsRoutes from './settingsRoutes';
import usageRoutes from './usageRoutes';
import verifyRoutes from './verifyRoutes';
import pollRoutes from './pollRoutes';

const router = Router();

router.use(healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/keys', keyRoutes);
router.use('/v1/settings', settingsRoutes);
router.use('/v1/usage', usageRoutes);
router.use('/v1/verify', verifyRoutes);
router.use('/v1/verify', pollRoutes);

export default router;
