import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);

export default router;
