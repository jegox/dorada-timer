import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://postgres:ExlbuyAZpCppmYfuUPqbaBlladjBNqBP@metro.proxy.rlwy.net:11252/railway?schema=dorada";
  const adapter = new PrismaPg({ connectionString }, { schema: "dorada" });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
