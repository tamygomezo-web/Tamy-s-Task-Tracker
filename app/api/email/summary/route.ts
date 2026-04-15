import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const RECIPIENT = "tamygomezo@gmail.com";

const CATEGORY_COLORS: Record<string, string> = {
  "High Priority": "#FF4444",
  "Work":          "#4ade80",
  "Personal":      "#C084FC",
  "Social":        "#F472B6",
  "Errands":       "#FBBF24",
  "Miscellaneous": "#86a84a",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "High Priority": "🔥",
  "Work":          "💼",
  "Personal":      "🏠",
  "Social":        "☕",
  "Errands":       "🛍️",
  "Miscellaneous": "📦",
};

interface TaskRow {
  id: number;
  title: string;
  due_date: string | null;
  category: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function getFormattedToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(
  urgent: TaskRow[],
  byCategory: Record<string, TaskRow[]>,
  formattedDate: string,
  appUrl: string,
  today: string,
): string {
  const hasContent = urgent.length > 0 || Object.keys(byCategory).length > 0;

  // ── Urgent section ────────────────────────────────────────────────────────
  let urgentSection = "";
  if (urgent.length > 0) {
    const cards = urgent.map((task) => {
      const isOverdue = task.due_date! < today;
      const dateLabel = isOverdue
        ? `⚠ Overdue &middot; ${formatDate(task.due_date)}`
        : "Due Today";
      const cat = task.category ?? "Uncategorized";
      const catColor = CATEGORY_COLORS[cat] ?? "#888";
      const catEmoji = CATEGORY_EMOJIS[cat] ?? "📌";
      return `<div style="background:#111115;border:1px solid rgba(255,68,68,0.16);border-left:3px solid #FF4444;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
  <div style="font-size:15px;font-weight:600;color:#e8e8e8;margin-bottom:5px;">${esc(task.title)}</div>
  <div style="font-size:12px;color:#FF4444;margin-bottom:2px;">${dateLabel}</div>
  <div style="font-size:12px;color:${catColor};">${catEmoji} ${esc(cat)}</div>
</div>`;
    }).join("\n");

    urgentSection = `<div style="margin-bottom:28px;">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#FF4444;margin-bottom:12px;font-weight:700;">Urgent — Overdue &amp; Due Today</div>
  ${cards}
</div>`;
  }

  // ── Upcoming section ──────────────────────────────────────────────────────
  let upcomingSection = "";
  const categories = Object.keys(byCategory);
  if (categories.length > 0) {
    const catBlocks = categories.map((cat) => {
      const color = CATEGORY_COLORS[cat] ?? "#888";
      const emoji = CATEGORY_EMOJIS[cat] ?? "📌";
      const rows = byCategory[cat].map((task, i, arr) => {
        const border = i < arr.length - 1 ? "border-bottom:1px solid #1e1e22;" : "";
        const dueLabel = task.due_date ? `📅 ${formatDate(task.due_date)}` : "No due date";
        return `<div style="padding:10px 14px;${border}">
  <div style="font-size:14px;color:#e8e8e8;">• ${esc(task.title)}</div>
  <div style="font-size:12px;color:#555;margin-top:2px;">${dueLabel}</div>
</div>`;
      }).join("\n");

      return `<div style="margin-bottom:18px;">
  <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:6px;">${emoji} ${esc(cat)}</div>
  <div style="background:#111115;border:1px solid #1e1e22;border-radius:8px;overflow:hidden;">
    ${rows}
  </div>
</div>`;
    }).join("\n");

    upcomingSection = `<div>
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:14px;font-weight:700;">Upcoming Tasks</div>
  ${catBlocks}
</div>`;
  }

  const emptyState = !hasContent
    ? `<div style="text-align:center;padding:48px 0;color:#444;">
  <div style="font-size:36px;margin-bottom:12px;">✓</div>
  <div style="font-size:15px;">You&apos;re all caught up! No pending tasks.</div>
</div>`
    : "";

  const footerLink = appUrl
    ? `<a href="${appUrl}" style="font-size:13px;color:#666;text-decoration:none;">Open Task Tracker →</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#0c0c0e;font-family:Calibri,'Segoe UI',Arial,sans-serif;color:#e8e8e8;">
<div style="max-width:580px;margin:0 auto;padding:36px 28px;">

<div style="margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #1e1e22;">
  <div style="font-size:21px;font-weight:700;color:#e8e8e8;letter-spacing:-0.5px;margin-bottom:4px;">Tamy&apos;s Task Tracker</div>
  <div style="font-size:13px;color:#555;">Daily Digest &nbsp;&middot;&nbsp; ${formattedDate}</div>
</div>

${emptyState}
${urgentSection}
${upcomingSection}

<div style="margin-top:36px;padding-top:20px;border-top:1px solid #1e1e22;">
  ${footerLink}
</div>

</div>
</body>
</html>`;
}

function buildText(
  urgent: TaskRow[],
  byCategory: Record<string, TaskRow[]>,
  formattedDate: string,
  appUrl: string,
  today: string,
): string {
  const sep = "=".repeat(48);
  const lines: string[] = [
    "Tamy's Task Tracker — Daily Digest",
    formattedDate,
    sep,
  ];

  const hasContent = urgent.length > 0 || Object.keys(byCategory).length > 0;

  if (!hasContent) {
    lines.push("", "You're all caught up! No pending tasks.");
  } else {
    if (urgent.length > 0) {
      lines.push("", "URGENT — OVERDUE & DUE TODAY", "");
      for (const task of urgent) {
        const isOverdue = task.due_date! < today;
        const label = isOverdue
          ? `⚠ Overdue · ${formatDate(task.due_date)}`
          : "Due Today";
        const cat = task.category ?? "Uncategorized";
        lines.push(label);
        lines.push(`  ${task.title}  [${cat}]`);
        lines.push("");
      }
    }

    const categories = Object.keys(byCategory);
    if (categories.length > 0) {
      lines.push(sep, "", "UPCOMING TASKS", "");
      for (const cat of categories) {
        lines.push(cat);
        for (const task of byCategory[cat]) {
          const due = task.due_date ? formatDate(task.due_date) : "No due date";
          lines.push(`  • ${task.title} (${due})`);
        }
        lines.push("");
      }
    }
  }

  lines.push(sep);
  if (appUrl) lines.push("", `Open Task Tracker: ${appUrl}`);

  return lines.join("\n");
}

async function sendDigest(): Promise<{ ok: boolean; error?: string }> {
  const sql = getDb();
  const tasks = (await sql`
    SELECT id, title, due_date, category
    FROM tasks
    WHERE done = false
    ORDER BY
      CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END,
      due_date ASC,
      created_at ASC
  `) as TaskRow[];

  const today = new Date().toISOString().split("T")[0];

  const urgent   = tasks.filter((t) => t.due_date && t.due_date <= today);
  const upcoming = tasks.filter((t) => !t.due_date || t.due_date > today);

  const byCategory: Record<string, TaskRow[]> = {};
  for (const task of upcoming) {
    const cat = task.category ?? "Uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(task);
  }

  const formattedDate = getFormattedToday();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const html = buildHtml(urgent, byCategory, formattedDate, appUrl, today);
  const text = buildText(urgent, byCategory, formattedDate, appUrl, today);

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: RECIPIENT, name: "Tamy's Task Tracker" },
      subject: `Task Digest — ${formattedDate}`,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html",  value: html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body };
  }

  return { ok: true };
}

export async function GET() {
  const result = await sendDigest();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST() {
  const result = await sendDigest();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
