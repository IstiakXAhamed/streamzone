import Link from "next/link";

/**
 * app/(site)/not-found.tsx
 * Custom 404: MovieZone logo, "content not found" message, "Back home" link.
 * (Req 19.6)
 */
export default function SiteNotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="mb-6 text-2xl font-extrabold tracking-tight text-[color:var(--color-brand)]">MovieZone</p>
        <h1 className="text-heading">Content not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-body text-[color:var(--color-text-secondary)]">
          The page or title you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-contrast)] transition-colors duration-150 hover:brightness-110"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
