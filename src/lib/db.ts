import { PrismaClient } from "@prisma/client";

// Eén gedeelde client: bij hot reload in dev maakt Next anders bij elke
// module-herlading een nieuwe connectie aan.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
