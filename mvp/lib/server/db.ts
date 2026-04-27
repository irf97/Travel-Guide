import { PrismaClient } from "@prisma/client";

type DbStatus = {
  configured: boolean;
  provider: "prisma" | "fallback";
  reason?: string;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDbStatus(): DbStatus {
  if (!process.env.DATABASE_URL) {
    return { configured: false, provider: "fallback", reason: "DATABASE_URL is not configured" };
  }
  return { configured: true, provider: "prisma" };
}

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export async function withDb<T>(handler: (db: PrismaClient) => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
  const db = getPrismaClient();
  if (!db) return fallback();
  try {
    return await handler(db);
  } catch (error) {
    console.error("Database adapter fallback", error);
    return fallback();
  }
}
