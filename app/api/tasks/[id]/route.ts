import { NextRequest, NextResponse } from "next/server";
import { getDb, Task } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const sql = getDb();
  const existing = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const task = existing[0] as Task;
  const body = await req.json();
  const { title, due_date, category, reminder, notes, done } = body;

  const updated = {
    title:    title    !== undefined ? title    : task.title,
    due_date: due_date !== undefined ? due_date : task.due_date,
    category: category !== undefined ? category : task.category,
    reminder: reminder !== undefined ? reminder : task.reminder,
    notes:    notes    !== undefined ? notes    : task.notes,
    done:     done     !== undefined ? done     : task.done,
  };

  const rows = await sql`
    UPDATE tasks
    SET title    = ${updated.title},
        due_date = ${updated.due_date},
        category = ${updated.category},
        reminder = ${updated.reminder},
        notes    = ${updated.notes},
        done     = ${updated.done}
    WHERE id = ${taskId}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`DELETE FROM tasks WHERE id = ${taskId} RETURNING id`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
