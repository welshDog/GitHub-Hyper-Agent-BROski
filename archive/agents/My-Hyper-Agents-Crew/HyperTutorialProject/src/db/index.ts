
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';

// Use a file-based SQLite DB in the project root
const dbPath = path.resolve(process.cwd(), 'hyper.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Helper to init/migrate manually if needed (Drizzle Kit handles this mostly)
export function initDB() {
    console.log(`📂 Database connected at: ${dbPath}`);
}
