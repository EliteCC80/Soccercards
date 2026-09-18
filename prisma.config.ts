import path from "node:path";
import { defineConfig } from "prisma/config";

// Met een Prisma-config laadt de CLI .env niet meer zelf; Next doet dat voor de
// app wel, dus hier expliciet voor de CLI-commando's (migrate, generate, seed).
process.loadEnvFile?.(path.join(process.cwd(), ".env"));

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
