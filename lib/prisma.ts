import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `prisma` variable for hot-reload in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : [],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
