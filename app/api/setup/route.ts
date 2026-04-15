import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      due_date   TEXT,
      category   TEXT,
      reminder   TEXT,
      notes      TEXT,
      source     TEXT DEFAULT 'web',
      done       BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  return NextResponse.json({ ok: true });
}
