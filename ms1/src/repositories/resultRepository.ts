import { getPrismaClient } from '../config/prismaClient';

const prisma = getPrismaClient();

export const createResult = async (data: any) => {
  return prisma.result.create({ data });
};
