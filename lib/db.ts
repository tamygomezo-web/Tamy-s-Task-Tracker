import { neon } from "@neondatabase/serverless";

export function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export interface Task {
  id: number;
  title: string;
  due_date: string | null;
  category: string | null;
  reminder: string | null;
  notes: string | null;
  source: string;
  done: boolean;
  created_at: string;
}
