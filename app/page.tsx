"use client";

import { useEffect, useState, useRef } from "react";

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  category: string;
  reminder: string;
  notes: string | null;
  source: string;
  done: boolean;
  created_at: string;
}

const CATEGORIES: { name: string; color: string; emoji: string }[] = [
  { name: "High Priority", color: "#FF4444", emoji: "🔥" },
  { name: "Work", color: "#4ade80", emoji: "💼" },
  { name: "Personal", color: "#C084FC", emoji: "🏠" },
  { name: "Social", color: "#F472B6", emoji: "☕" },
  { name: "Errands", color: "#FBBF24", emoji: "🛍️" },
  { name: "Miscellaneous", color: "#86a84a", emoji: "📦" },
];

const REMINDERS = [
  "None",
  "On due date",
  "1 day before",
  "3 days before",
  "1 week before",
  "Every morning",
];

function getCategoryMeta(name: string) {
  return CATEGORIES.find((c) => c.name === name) ?? { name, color: "#888", emoji: "📌" };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function isOverdue(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return due < today;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState(CATEGORIES[0].name);
  const [fDueDate, setFDueDate] = useState("");
  const [fReminder, setFReminder] = useState("None");
  const [fNotes, setFNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Close form on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showForm && formRef.current && !formRef.current.contains(e.target as Node)) {
        resetForm();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showForm]);

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  function resetForm() {
    setShowForm(false);
    setFTitle("");
    setFCategory(CATEGORIES[0].name);
    setFDueDate("");
    setFReminder("None");
    setFNotes("");
    setFormError("");
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle.trim()) { setFormError("Title is required."); return; }
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fTitle,
        category: fCategory,
        due_date: fDueDate || null,
        reminder: fReminder,
        notes: fNotes || null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => {
        const next = [...prev, task];
        return next.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        });
      });
      resetForm();
    }
    setSubmitting(false);
  }

  async function toggleDone(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  }

  async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function saveEdit(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        due_date: editDueDate || null,
        notes: editNotes || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingId(null);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date ?? "");
    setEditNotes(task.notes ?? "");
  }

  const filtered = tasks.filter((t) => {
    if (filter === "active" && t.done) return false;
    if (filter === "done" && !t.done) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: "#0c0c0e",
        color: "#e8e8e8",
        minHeight: "100vh",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 36px 20px",
          borderBottom: "1px solid #1e1e22",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
            Tamy&apos;s Task Tracker
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "Calibri, 'Segoe UI', sans-serif",
              padding: 0,
            }}
          >
            Log out
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              backgroundColor: "#e8e8e8",
              color: "#0c0c0e",
              fontSize: 24,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 300,
              lineHeight: 1,
            }}
            title="Add task"
          >
            +
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: "14px 36px",
          borderBottom: "1px solid #1e1e22",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", width: 60, flexShrink: 0 }}>
            Status
          </span>
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f === "pending" ? "active" : f)}
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                border: (f === "pending" ? filter === "active" : filter === f)
                  ? "1px solid #e8e8e8"
                  : "1px solid #333",
                backgroundColor: (f === "pending" ? filter === "active" : filter === f)
                  ? "#e8e8e8"
                  : "transparent",
                color: (f === "pending" ? filter === "active" : filter === f)
                  ? "#0c0c0e"
                  : "#888",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "Calibri, 'Segoe UI', sans-serif",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Category row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", width: 60, flexShrink: 0 }}>
            Category
          </span>
          <button
            onClick={() => setCategoryFilter("all")}
            style={{
              padding: "4px 14px",
              borderRadius: 20,
              border: categoryFilter === "all" ? "1px solid #e8e8e8" : "1px solid #333",
              backgroundColor: categoryFilter === "all" ? "#e8e8e8" : "transparent",
              color: categoryFilter === "all" ? "#0c0c0e" : "#888",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "Calibri, 'Segoe UI', sans-serif",
            }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategoryFilter(c.name)}
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                border: categoryFilter === c.name ? `1px solid ${c.color}` : "1px solid #333",
                backgroundColor: categoryFilter === c.name ? c.color + "22" : "transparent",
                color: categoryFilter === c.name ? c.color : "#666",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "Calibri, 'Segoe UI', sans-serif",
              }}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: "24px 36px", maxWidth: 860, margin: "0 auto" }}>
        {loading ? (
          <p style={{ color: "#555", fontSize: 15 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <p style={{ fontSize: 38 }}>✓</p>
            <p style={{ fontSize: 15 }}>No tasks here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((task) => {
              const meta = getCategoryMeta(task.category);
              const overdue = isOverdue(task.due_date, task.done);
              const isEditing = editingId === task.id;
              return (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: "#111115",
                    border: `1px solid ${overdue ? "#FF444430" : "#1e1e22"}`,
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: 10,
                    padding: "14px 18px",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    opacity: task.done ? 0.55 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleDone(task)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${task.done ? meta.color : "#444"}`,
                      backgroundColor: task.done ? meta.color : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0c0c0e",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    title={task.done ? "Mark as active" : "Mark as done"}
                  >
                    {task.done && "✓"}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={inputStyle}
                          autoFocus
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          style={inputStyle}
                        />
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes..."
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical" }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => saveEdit(task)} style={saveBtnStyle}>Save</button>
                          <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              textDecoration: task.done ? "line-through" : "none",
                              wordBreak: "break-word",
                            }}
                          >
                            {task.title}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: meta.color,
                              backgroundColor: meta.color + "18",
                              borderRadius: 12,
                              padding: "2px 8px",
                              flexShrink: 0,
                            }}
                          >
                            {meta.emoji} {meta.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                          {task.due_date && (
                            <span style={{ fontSize: 12, color: overdue ? "#FF4444" : "#666" }}>
                              {overdue ? "⚠ Overdue · " : "📅 "}{formatDate(task.due_date)}
                            </span>
                          )}
                          {task.reminder !== "None" && (
                            <span style={{ fontSize: 12, color: "#555" }}>
                              🔔 {task.reminder}
                            </span>
                          )}
                        </div>
                        {task.notes && (
                          <p style={{ fontSize: 13, color: "#666", margin: "6px 0 0", lineHeight: 1.5 }}>
                            {task.notes}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignItems: "flex-end" }}>
                      <button
                        onClick={() => startEdit(task)}
                        style={actionBtnStyle}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{ ...actionBtnStyle, color: "#FF4444", borderColor: "#FF444440" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            ref={formRef}
            style={{
              backgroundColor: "#16161a",
              borderRadius: 14,
              padding: "28px 30px",
              width: "100%",
              maxWidth: 480,
              border: "1px solid #2a2a2e",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>New Task</h2>
              <button
                onClick={resetForm}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTask} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  style={inputStyle}
                  autoFocus
                />
                {formError && <p style={{ color: "#FF4444", fontSize: 12, margin: "4px 0 0" }}>{formError}</p>}
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label style={labelStyle}>Due Date (optional)</label>
                <input
                  type="date"
                  value={fDueDate}
                  onChange={(e) => setFDueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Reminder */}
              <div>
                <label style={labelStyle}>Reminder</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {REMINDERS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFReminder(r)}
                      style={{
                        padding: "5px 13px",
                        borderRadius: 20,
                        border: fReminder === r ? "1px solid #e8e8e8" : "1px solid #333",
                        backgroundColor: fReminder === r ? "#e8e8e8" : "transparent",
                        color: fReminder === r ? "#0c0c0e" : "#888",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "Calibri, 'Segoe UI', sans-serif",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4,
                  padding: "11px",
                  borderRadius: 8,
                  backgroundColor: "#e8e8e8",
                  color: "#0c0c0e",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "Calibri, 'Segoe UI', sans-serif",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #2a2a2e",
  backgroundColor: "#0c0c0e",
  color: "#e8e8e8",
  fontSize: 14,
  fontFamily: "Calibri, 'Segoe UI', sans-serif",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#888",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const actionBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid #2a2a2e",
  cursor: "pointer",
  fontSize: 12,
  padding: "3px 10px",
  borderRadius: 6,
  color: "#888",
  fontFamily: "Calibri, 'Segoe UI', sans-serif",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: 6,
  backgroundColor: "#e8e8e8",
  color: "#0c0c0e",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "Calibri, 'Segoe UI', sans-serif",
  fontWeight: 600,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: 6,
  backgroundColor: "transparent",
  color: "#888",
  border: "1px solid #333",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "Calibri, 'Segoe UI', sans-serif",
};
