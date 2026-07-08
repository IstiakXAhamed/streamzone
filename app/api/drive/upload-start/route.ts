import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireRole } from "@/lib/requireRole";
import { randomUUID } from "crypto";

/**
 * In-memory store for active upload sessions. Maps sessionId → upload metadata.
 * In production with multiple instances, use Redis. For single-instance Vercel
 * serverless, this works because the session is short-lived and the same
 * function instance handles sequential chunk requests.
 *
 * NOTE: Vercel serverless functions may use different instances per request.
 * We store the uploadUrl in the client and pass it in the request body instead.
 */

export interface UploadSession {
  uploadUrl: string;
  token: string;
  createdAt: number;
}

// We'll pass uploadUrl + token via encrypted session cookie or request body
// For simplicity and reliability on Vercel, return them to the client encrypted.

/**
 * POST /api/drive/upload-start
 *
 * Admin-only. Creates a Google Drive resumable upload session using the admin's
 * own Google OAuth token. Returns a sessionId with the upload URL.
 */
export async function POST(req: Request) {
  try {
    const { error } = await requireRole("admin", "superadmin");
    if (error) return error;

    const session = await getServerSession(authOptions);
    const googleAccessToken = (session as any)?.googleAccessToken as string | null;

    if (!googleAccessToken) {
      return NextResponse.json(
        { error: "Google Drive access not available. Please sign out and sign in again with Google to grant Drive permissions." },
        { status: 401 },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const raw = await req.text();
    if (!raw || raw.trim().length === 0) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let parsed: { name?: string; mimeType?: string; parentFolderId?: string; fileSize?: number };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!parsed?.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const parentFolderId = parsed.parentFolderId ?? process.env.NEXT_PUBLIC_MOVIEZONE_DRIVE_FOLDER_ID;
    const metadata: Record<string, unknown> = { name: parsed.name };
    if (parentFolderId) metadata.parents = [parentFolderId];

    const mimeType = parsed.mimeType ?? "application/octet-stream";

    // Create resumable upload session
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${googleAccessToken}`,
          "content-type": "application/json; charset=UTF-8",
          "x-upload-content-type": mimeType,
          ...(parsed.fileSize ? { "x-upload-content-length": String(parsed.fileSize) } : {}),
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Drive resumable session failed:", res.status, errText);
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: "Google token expired or insufficient permissions. Please sign out and sign in again." },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: `Drive session failed: ${res.status} — ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const uploadUrl = res.headers.get("location");
    if (!uploadUrl) {
      return NextResponse.json({ error: "Drive returned no upload URL" }, { status: 502 });
    }

    // Return uploadUrl and token to the client. The client will send them
    // in the request body of each chunk (not in query params, to avoid URL length issues).
    return NextResponse.json({ uploadUrl, token: googleAccessToken });
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
