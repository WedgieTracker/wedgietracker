import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../packages/core/src/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
