"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Registration failed.");
        return;
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Join MovieZone</h1>
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Create a free account. You&apos;ll be able to browse as soon as an admin
          approves your account.
        </p>
      </header>

      {done ? (
        <div className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)]/60 p-6 text-center text-sm">
          <p className="font-semibold text-white">Registration received.</p>
          <p className="mt-1 text-[color:var(--color-text-secondary)]">
            Sign in once an admin approves your account.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-full bg-[color:var(--color-brand)] px-6 py-2 text-sm font-medium text-white"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-medium text-black transition active:scale-[0.98]"
          >
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-[color:var(--color-text-tertiary)]">
            <span className="h-px flex-1 bg-[color:var(--color-border-subtle)]" />
            or create with email
            <span className="h-px flex-1 bg-[color:var(--color-border-subtle)]" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-full bg-[color:var(--color-surface-2)] px-5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-full bg-[color:var(--color-surface-2)] px-5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
            />
            {error && <p className="text-xs text-[color:var(--color-brand)]">{error}</p>}
            <button className="h-12 w-full rounded-full bg-[color:var(--color-brand)] font-medium transition active:scale-[0.98]">
              Create account
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-[color:var(--color-text-secondary)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[color:var(--color-brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
