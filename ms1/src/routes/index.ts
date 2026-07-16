import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';

const router = Router();

router.use(healthRoutes);
router.use('/v1/auth', authRoutes);

export default router;
