import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
const isProduction = process.env.NODE_ENV === 'production';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
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
