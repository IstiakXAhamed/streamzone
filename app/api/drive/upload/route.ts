import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/googleDrive";
import { requireRole } from "@/lib/requireRole";

/**
 * POST /api/drive/upload
 * Admin-only. Accepts multipart/form-data (the raw file bytes), uploads them
 * to Google Drive via the service account, and returns the Drive file metadata.
 * Server-side upload avoids the browser CORS limitation with resumable URLs.
 */
export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  void user;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const token = await getAccessToken();
    const folderId = process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID;

    // create metadata + upload in one multipart request
    const metadata = {
      name: file.name,
      mimeType: file.type || undefined,
      ...(folderId ? { parents: [folderId] } : {}),
    };
    const uploadForm = new FormData();
    uploadForm.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    uploadForm.append("file", file);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,thumbnailLink",
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: uploadForm,
      },
    );
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Drive upload failed: ${uploadRes.status} ${errText.slice(0, 200)}`);
    }
    const meta = (await uploadRes.json()) as {
      id: string; name: string; size?: string; mimeType: string; thumbnailLink?: string;
    };
    return NextResponse.json({
      id: meta.id,
      name: meta.name,
      size: meta.size ? Number(meta.size) : null,
      mimeType: meta.mimeType,
      thumbnailLink: meta.thumbnailLink ?? null,
    });
  } catch (e) {
    console.error("drive/upload failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
