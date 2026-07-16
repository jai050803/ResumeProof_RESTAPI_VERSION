import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import keyRoutes from './keyRoutes';

const router = Router();

router.use(healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/keys', keyRoutes);

export default router;
