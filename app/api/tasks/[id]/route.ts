import { NextRequest, NextResponse } from "next/server";
import { getDb, TaskRow } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

function normalise(row: TaskRow) {
  return { ...row, done: row.done === 1 };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(taskId) as TaskRow | undefined;

  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, due_date, category, reminder, notes, done } = body;

  const updated = {
    title:    title    !== undefined ? title    : existing.title,
    due_date: due_date !== undefined ? due_date : existing.due_date,
    category: category !== undefined ? category : existing.category,
    reminder: reminder !== undefined ? reminder : existing.reminder,
    notes:    notes    !== undefined ? notes    : existing.notes,
    done:     done     !== undefined ? (done ? 1 : 0) : existing.done,
  };

  db.prepare(
    `UPDATE tasks SET title=?, due_date=?, category=?, reminder=?, notes=?, done=?
     WHERE id=?`
  ).run(
    updated.title,
    updated.due_date,
    updated.category,
    updated.reminder,
    updated.notes,
    updated.done,
    taskId
  );

  const result = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(taskId) as TaskRow;

  return NextResponse.json(normalise(result));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const db = getDb();
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);

  if (info.changes === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
