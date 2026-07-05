import Link from "next/link";

export default function SiteNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-[color:var(--color-brand)]">404</span> · Not found
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">That page or title doesn&apos;t exist (yet).</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-[color:var(--color-brand)] px-5 py-2 text-sm font-medium text-white">Back home</Link>
      </div>
    </main>
  );
}
