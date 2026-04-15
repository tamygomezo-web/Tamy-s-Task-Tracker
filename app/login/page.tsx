"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password.");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        backgroundColor: "#0c0c0e",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#111115",
          border: "1px solid #1e1e22",
          borderRadius: 14,
          padding: "36px 40px",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h1
          style={{
            color: "#e8e8e8",
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
          }}
        >
          Tamy&apos;s Task Tracker
        </h1>
        <p style={{ color: "#555", fontSize: 13, margin: "0 0 28px" }}>
          Enter password to continue
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: error ? "1px solid #FF444460" : "1px solid #2a2a2e",
              backgroundColor: "#0c0c0e",
              color: "#e8e8e8",
              fontSize: 15,
              fontFamily: "Calibri, 'Segoe UI', sans-serif",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && (
            <p style={{ color: "#FF4444", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: "11px",
              borderRadius: 8,
              backgroundColor: "#e8e8e8",
              color: "#0c0c0e",
              border: "none",
              cursor: loading || !password ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "Calibri, 'Segoe UI', sans-serif",
              opacity: loading || !password ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
