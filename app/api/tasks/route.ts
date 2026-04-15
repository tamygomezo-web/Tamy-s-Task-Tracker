import { NextRequest, NextResponse } from "next/server";
import { getDb, TaskRow } from "@/lib/db";

function normalise(row: TaskRow) {
  return { ...row, done: row.done === 1 };
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       ORDER BY
         CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END,
         due_date ASC`
    )
    .all() as TaskRow[];

  return NextResponse.json(rows.map(normalise));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, due_date, reminder, notes } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!category || typeof category !== "string") {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO tasks (title, due_date, category, reminder, notes, source)
       VALUES (?, ?, ?, ?, ?, 'web')`
    )
    .run(title.trim(), due_date || null, category, reminder || "None", notes || null);

  const created = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(info.lastInsertRowid) as TaskRow;

  return NextResponse.json(normalise(created), { status: 201 });
}
