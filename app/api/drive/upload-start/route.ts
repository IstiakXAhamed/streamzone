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

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json", received: contentType },
      { status: 400 },
    );
  }
  const raw = await req.text();
  let parsed: { name?: string; mimeType?: string; parentFolderId?: string };
  try {
    parsed = JSON.parse(raw) as { name?: string; mimeType?: string; parentFolderId?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", received: raw.slice(0, 200) },
      { status: 400 },
    );
  }
  if (!parsed?.name) {
    return NextResponse.json({ error: "name is required", received: raw.slice(0, 200) }, { status: 400 });
  }

  try {
    const result = await createResumableUploadSession({
      name: parsed.name,
      mimeType: parsed.mimeType,
      parentFolderId: parsed.parentFolderId ?? process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message, stack: (e as Error).stack },
      { status: 500 },
    );
  }
}
