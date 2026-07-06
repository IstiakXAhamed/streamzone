import { NextResponse } from "next/server";
import { createResumableUploadSession } from "@/lib/googleDrive";
import { requireRole } from "@/lib/requireRole";

/**
 * POST /api/drive/upload-start
 * Admin-only. Creates a Drive resumable-upload session so the browser can PUT
 * bytes directly to Google (zero server bandwidth). Body: { name, mimeType?, parentFolderId? }
 * Returns { uploadUrl, fileId }.
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  void user;

  const body = (await req.json().catch(() => null)) as {
    name?: string; mimeType?: string; parentFolderId?: string;
  } | null;
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const result = await createResumableUploadSession({
      name: body.name,
      mimeType: body.mimeType,
      parentFolderId: body.parentFolderId ?? process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
