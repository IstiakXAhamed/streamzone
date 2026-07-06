import { NextResponse } from "next/server";
import { finalizeUpload } from "@/lib/googleDrive";
import { requireRole } from "@/lib/requireRole";

/**
 * POST /api/drive/upload-finalize
 * Admin-only. Confirms a Drive upload finished and returns the file metadata
 * (id, name, size, mimeType, thumbnailLink) so the client can store the
 * fileId in Supabase.
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  void user;

  const body = (await req.json().catch(() => null)) as { fileId?: string } | null;
  if (!body?.fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const meta = await finalizeUpload(body.fileId);
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
