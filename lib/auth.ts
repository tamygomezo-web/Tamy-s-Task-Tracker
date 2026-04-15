export const SESSION_COOKIE = "session";

export async function getSessionToken(): Promise<string> {
  const password = process.env.APP_PASSWORD ?? "";
  const encoder = new TextEncoder();
  const data = encoder.encode(`task-tracker:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
