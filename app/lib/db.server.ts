import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === 'production';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

if (isProduction) {
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.__db__) {
    globalThis.__db__ = new PrismaClient({ adapter });
  }
  prisma = globalThis.__db__;
  prisma.$connect();
}

export { prisma };
