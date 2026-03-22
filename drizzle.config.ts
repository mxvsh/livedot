import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./packages/db/src/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./packages/db/latty.db",
  },
});
