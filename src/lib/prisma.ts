import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function getPoolOptions(connectionString: string) {
  const url = new URL(connectionString);
  const usesSupabase = url.hostname.endsWith(".supabase.co");
  const sslmode = url.searchParams.get("sslmode");
  const needsSsl = usesSupabase || sslmode !== null;
  const poolUrl = new URL(connectionString);

  poolUrl.searchParams.delete("schema");
  poolUrl.searchParams.delete("sslmode");

  return {
    connectionString: poolUrl.toString(),
    ssl: needsSsl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  };
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const pool = new Pool(getPoolOptions(connectionString));

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
