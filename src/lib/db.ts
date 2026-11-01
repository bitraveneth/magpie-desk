import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; deskPulse?: boolean };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

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
