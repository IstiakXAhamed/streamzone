import { NextResponse } from "next/server";
import { createResumableUploadSession } from "@/lib/googleDrive";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireRole("admin", "superadmin");
    if (error) return error;

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json", received: contentType }, { status: 400 });
    }

    const raw = await req.text();
    if (!raw || raw.trim().length === 0) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let parsed: { name?: string; mimeType?: string; parentFolderId?: string };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return NextResponse.json({ error: "Invalid JSON", received: raw.slice(0, 200) }, { status: 400 });
    }

    if (!parsed?.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const result = await createResumableUploadSession({
      name: parsed.name,
      mimeType: parsed.mimeType,
      parentFolderId: parsed.parentFolderId ?? process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID,
      origin: req.headers.get("origin") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
