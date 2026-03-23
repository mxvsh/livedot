import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createLogger } from "@livedot/logger";
import * as schema from "./schema";

const log = createLogger("db");

const __dirname = dirname(fileURLToPath(import.meta.url));

// Both bun:sqlite and libsql drizzle instances share this base type
let db: BaseSQLiteDatabase<"sync" | "async", any, typeof schema>;

if (process.env.TURSO_URL) {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const { migrate } = await import("drizzle-orm/libsql/migrator");

  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const d = drizzle(client, { schema });

  if (process.env.NODE_ENV === "production") {
    await migrate(d, { migrationsFolder: resolve(__dirname, "./migrations") });
  }

  db = d;
  log.info("Using Turso");
} else {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");

  const dbPath = process.env.DATABASE_PATH || resolve(__dirname, "./data/livedot.db");
  const sqlite = new Database(dbPath, { create: true });
  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run("PRAGMA foreign_keys = ON;");

  const d = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV === "production") {
    migrate(d, { migrationsFolder: resolve(__dirname, "./migrations") });
  }

  db = d;
  log.info("Using SQLite");
}

export { db };
