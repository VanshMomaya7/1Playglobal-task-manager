import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    // Treat empty string as unset (bad .env) so Studio/CLI still get a valid default for local Docker Postgres.
    url:
      process.env["DATABASE_URL"]?.trim() ||
      "postgresql://postgres:postgres@localhost:5433/taskmanager",
  },
});
