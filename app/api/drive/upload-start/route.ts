import { NextResponse } from "next/server";
import { createResumableUploadSession } from "@/lib/googleDrive";
import { requireRole } from "@/lib/requireRole";
import { randomUUID } from "crypto";

/**
 * In-memory map of upload sessions. In production you'd use Redis or similar,
 * but for a single-instance deploy this is fine. Entries expire after 24h.
 */
const uploadSessions = new Map<string, { uploadUrl: string; accessToken: string; createdAt: number }>();

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of uploadSessions) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) uploadSessions.delete(id);
  }
}, 10 * 60 * 1000);

export function getUploadSession(sessionId: string) {
  return uploadSessions.get(sessionId) ?? null;
}

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

    // Store the session server-side; give the client an opaque session ID
    const sessionId = randomUUID();
    uploadSessions.set(sessionId, {
      uploadUrl: result.uploadUrl,
      accessToken: result.accessToken,
      createdAt: Date.now(),
    });

    return NextResponse.json({ sessionId });
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
