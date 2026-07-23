import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../config/prismaClient';
import { redis } from '../config/redisClient';
import * as queueService from '../services/queueService';

const prisma = getPrismaClient();

const checkDatabase = async () => {
  const start = Date.now();
  try {
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out')), 3000)
    );
    await Promise.race([dbPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;
    return { status: 'healthy', latencyMs };
  } catch (error) {
    return { status: 'down', latencyMs: null };
  }
};

const checkRedis = async () => {
  const start = Date.now();
  try {
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timed out')), 2000)
    );
    const result = await Promise.race([pingPromise, timeoutPromise]);
    if (result === 'PONG') {
      const latencyMs = Date.now() - start;
      return { status: 'healthy', latencyMs };
    }
    return { status: 'down', latencyMs: null };
  } catch (error) {
    return { status: 'down', latencyMs: null };
  }
};

const checkQueue = async () => {
  try {
    const stats = await queueService.getQueueStats();
    const wait = stats.wait || 0;
    const delayed = stats.delayed || 0;
    const depth = wait + delayed;
    return {
      status: 'healthy',
      depth,
      oldestJobAgeSec: null
    };
  } catch (error) {
    return {
      status: 'down'
    };
  }
};

const generateLatencyStub = (window: string) => {
  let pointsCount = 48;
  let intervalMinutes = 30;

  switch (window) {
    case '1h':
      pointsCount = 12;
      intervalMinutes = 5;
      break;
    case '6h':
      pointsCount = 24;
      intervalMinutes = 15;
      break;
    case '24h':
      pointsCount = 48;
      intervalMinutes = 30;
      break;
    case '7d':
      pointsCount = 56;
      intervalMinutes = 180;
      break;
    default:
      pointsCount = 48;
      intervalMinutes = 30;
      break;
  }

  const data = [];
  const now = Date.now();

  for (let i = pointsCount - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalMinutes * 60 * 1000).toISOString();
    const p50 = Math.floor(Math.random() * (150 - 80 + 1)) + 80;
    const p95 = Math.floor(Math.random() * (400 - 200 + 1)) + 200;
    const p99 = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
    data.push({ time, p50, p95, p99 });
  }

  return data;
};

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [dbHealth, redisHealth, queueHealth] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkQueue()
    ]);

    res.status(200).json({
      api: { status: 'healthy', uptimeSec: process.uptime() },
      database: dbHealth,
      redis: redisHealth,
      queue: queueHealth,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

export const getLatencyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const window = (req.query.window as string) || '24h';
    const data = generateLatencyStub(window);

    res.status(200).json({
      _note: 'stub — OTel integration pending',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 50;
    }
    if (limit > 200) {
      limit = 200;
    }

    const clientId = req.query.clientId ? String(req.query.clientId).trim() : undefined;
    const event = req.query.event ? String(req.query.event).trim() : undefined;
    const from = req.query.from ? String(req.query.from).trim() : undefined;
    const to = req.query.to ? String(req.query.to).trim() : undefined;

    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (event) {
      where.event = { contains: event, mode: 'insensitive' };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const serializedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString()
    }));

    res.status(200).json({
      logs: serializedLogs,
      total,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
};
