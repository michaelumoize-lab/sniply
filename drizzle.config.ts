import { defineConfig } from "drizzle-kit";

try {
  // Built into Node 20.6+
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already loaded
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
  },
});
