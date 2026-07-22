import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes';

const router = Router();

router.use('/auth', adminAuthRoutes);

export default router;
