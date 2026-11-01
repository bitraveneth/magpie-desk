import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; deskPulse?: boolean };

function databaseUrl() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL for the desk database.");
  return url;
}

function client() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ datasources: { db: { url: databaseUrl() } } });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const value = client()[property as keyof PrismaClient];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client()) : value;
  },
});

export const join = { relationLoadStrategy: "join" as const };

export function keepDatabaseAwake() {
  if (globalForPrisma.deskPulse) return;
  globalForPrisma.deskPulse = true;
  setInterval(() => {
    prisma.$queryRaw`SELECT 1`.catch(() => undefined);
  }, 20_000);
}
