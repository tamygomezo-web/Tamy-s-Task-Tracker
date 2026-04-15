import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM tasks
    ORDER BY
      CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END,
      due_date ASC
  `;
  return NextResponse.json(rows);
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

  const sql = getDb();
  const rows = await sql`
    INSERT INTO tasks (title, due_date, category, reminder, notes, source)
    VALUES (${title.trim()}, ${due_date || null}, ${category}, ${reminder || "None"}, ${notes || null}, 'web')
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
