import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tasks.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT    NOT NULL,
        due_date   TEXT,
        category   TEXT    NOT NULL,
        reminder   TEXT    NOT NULL DEFAULT 'None',
        notes      TEXT,
        source     TEXT    NOT NULL DEFAULT 'web',
        done       INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

/** Raw row as returned by better-sqlite3 (done is 0 or 1) */
export interface TaskRow {
  id: number;
  title: string;
  due_date: string | null;
  category: string;
  reminder: string;
  notes: string | null;
  source: string;
  done: number;
  created_at: string;
}

/** Normalised task with done as boolean */
export interface Task extends Omit<TaskRow, "done"> {
  done: boolean;
}
