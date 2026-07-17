import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import jobRoutes from './routes/jobRoutes';
import { AppError } from './errors/AppError';
import { Request, Response, NextFunction } from 'express';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobRoutes);

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
