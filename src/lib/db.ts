import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; deskPulse?: boolean };

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: databaseUrl } } });

export const join = { relationLoadStrategy: "join" as const };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function keepDatabaseAwake() {
  if (globalForPrisma.deskPulse) return;
  globalForPrisma.deskPulse = true;
  setInterval(() => {
    prisma.$queryRaw`SELECT 1`.catch(() => undefined);
  }, 20_000);
}
