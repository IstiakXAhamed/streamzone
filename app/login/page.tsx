"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in AND has a valid DB record, bounce to homepage.
  // Don't bounce if the session is stale (user deleted from DB) — let them re-login.
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/me/history?limit=1");
        if (res.ok) {
          router.replace("/");
        }
      } catch { /* stale session — stay on login */ }
    })();
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Invalid email or password, or your account is pending approval.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Sign in with Google, or use your email.
        </p>
      </header>

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-medium text-black transition active:scale-[0.98]"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-[color:var(--color-text-tertiary)]">
        <span className="h-px flex-1 bg-[color:var(--color-border-subtle)]" />
        or
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
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-full bg-[color:var(--color-surface-2)] px-5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          />
          {error && <p className="text-xs text-[color:var(--color-brand)]">{error}</p>}
          <button className="h-12 w-full rounded-full bg-[color:var(--color-brand)] font-medium transition active:scale-[0.98]">
            Sign in
          </button>
        </form>

      <p className="text-center text-sm text-[color:var(--color-text-secondary)]">
        No account?{" "}
        <Link href="/register" className="text-[color:var(--color-brand)] hover:underline">
          Register
        </Link>{" "}
        — you&apos;ll be able to browse once an admin approves you.
      </p>
    </main>
  );
}
