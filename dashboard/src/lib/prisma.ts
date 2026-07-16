import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton du client Prisma, pour éviter d'ouvrir une nouvelle connexion à
// chaque rechargement à chaud en développement (pattern standard Next.js).
// Prisma 7 exige un adaptateur explicite (plus de connexion implicite via
// une URL dans le schéma) : on utilise l'adaptateur node-postgres officiel.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
