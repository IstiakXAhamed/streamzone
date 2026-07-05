import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)]/60 p-8">
        <h1 className="text-2xl font-bold">Awaiting admin approval</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
          An administrator needs to approve your account before you can stream.
          You&apos;ll be able to sign in and browse as soon as that happens.
        </p>
      </div>
      <Link
        href="/api/auth/signout"
        className="mt-2 rounded-full bg-[color:var(--color-brand)] px-6 py-2 text-sm font-medium text-white"
      >
        Sign out
      </Link>
    </main>
  );
}
