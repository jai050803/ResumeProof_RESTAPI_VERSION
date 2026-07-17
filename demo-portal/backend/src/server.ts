import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import jobRoutes from './routes/jobRoutes';
import { uploadMiddleware } from './middlewares/uploadMiddleware';
import * as applyController from './controllers/applyController';
import * as adminController from './controllers/adminController';
import { AppError } from './errors/AppError';
import { Request, Response, NextFunction } from 'express';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobRoutes);
app.post('/api/apply', uploadMiddleware.single('resume'), applyController.apply);
app.get('/api/apply/:applicationId/status', applyController.checkStatus);
app.get('/api/admin/applications', adminController.getAllApplications);
app.get('/api/admin/jobs/:jobId/applications', adminController.getApplicationsByJobId);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

app.listen(env.DEMO_PORT, () => {
  console.log(`Demo backend running on port ${env.DEMO_PORT}`);
});
