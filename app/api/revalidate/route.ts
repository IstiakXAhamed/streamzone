import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/requireRole";

/**
 * POST /api/revalidate
 *
 * Admin-only endpoint to bust server-side caches after content changes
 * (movie added, updated, deleted, series changed, etc.). Accepts a JSON
 * body with `tags` array: ["movies"], ["series"], or ["movies", "series"].
 *
 * Usage from admin pages:
 *   await fetch("/api/revalidate", {
 *     method: "POST",
 *     headers: { "content-type": "application/json" },
 *     body: JSON.stringify({ tags: ["movies"] }),
 *   });
 */
export async function POST(req: Request) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const body = await req.json().catch(() => null) as { tags?: string[] } | null;
  const tags = body?.tags ?? ["movies", "series"];

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: tags, now: Date.now() });
}
