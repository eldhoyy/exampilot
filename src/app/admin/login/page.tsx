"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin@exampilot.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163b36] text-white"><ShieldCheck size={24}/></div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">ExamPilot</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--ink)]">Administrator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">This area is restricted to the ExamPilot administrator.</p>
        <form onSubmit={signIn} className="mt-7 space-y-4">
          <div><label htmlFor="admin-username" className="mb-2 block text-sm font-semibold text-slate-700">Username</label><input id="admin-username" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--surface-muted)]"/></div>
          <div><label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label><input id="admin-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--surface-muted)]"/></div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <button disabled={loading || !password} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"><LockKeyhole size={16}/>{loading ? "Signing in…" : "Sign in securely"}</button>
        </form>
        <p className="mt-6 text-xs leading-5 text-slate-400">Admin activity is protected by a private server session. Do not share your credentials.</p>
      </section>
    </main>
  );
}
