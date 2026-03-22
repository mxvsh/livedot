import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "../latty.db");

const sqlite = new Database(dbPath);
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
