import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireRole } from "@/lib/requireRole";

/**
 * POST /api/drive/upload-start
 *
 * Admin-only. Creates a Google Drive resumable upload session using the admin's
 * own Google OAuth token (so files count against THEIR Drive quota, not the
 * service account which has zero quota). Returns the upload URL with embedded
 * token for direct browser → Google upload with no size limit.
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

    let parsed: { name?: string; mimeType?: string; parentFolderId?: string };
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
    const origin = req.headers.get("origin") ?? undefined;

    const headers: Record<string, string> = {
      authorization: `Bearer ${googleAccessToken}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": mimeType,
    };
    if (origin) headers["origin"] = origin;

    // Create resumable upload session using the user's own OAuth token
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers,
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

    const locationUrl = res.headers.get("location");
    if (!locationUrl) {
      return NextResponse.json({ error: "Drive returned no upload URL" }, { status: 502 });
    }

    // Embed the user's access token in the URL so the browser can PUT directly
    // to Google without CORS issues (no Authorization header = simple request).
    const separator = locationUrl.includes("?") ? "&" : "?";
    const uploadUrl = `${locationUrl}${separator}access_token=${encodeURIComponent(googleAccessToken)}`;

    return NextResponse.json({ uploadUrl });
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
