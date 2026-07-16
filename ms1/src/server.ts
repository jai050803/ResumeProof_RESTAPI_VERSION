import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './utils/logger';
import routes from './routes';
import { globalErrorHandler } from './errors/globalErrorHandler';
import { AppError } from './errors/AppError';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', routes);

app.use((req, res, next) => {
  next(new AppError('not_found', 404));
});

app.use(globalErrorHandler);

const startServer = () => {
  app.listen(env.MS1_PORT, () => {
    logger.info(`Server is running on port ${env.MS1_PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer();
