import { Router } from 'express';
import * as internalController from '../controllers/internalController';
import { internalAuthMiddleware } from '../middlewares/internalAuthMiddleware';

const router = Router();

router.use(internalAuthMiddleware);
router.post('/result', internalController.handleResult);
router.get('/transaction/:transactionId', internalController.getTransactionDetails);
router.post('/status', internalController.handleStatusUpdate);

export default router;
