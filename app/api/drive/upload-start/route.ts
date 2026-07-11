import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStorageAccountToken } from "@/lib/googleDrive";

/**
 * POST /api/drive/upload-start
 *
 * Admin-only. Creates a Google Drive resumable upload session using the
 * dedicated STORAGE account's token (owns the 5TB). Files are owned by that
 * account regardless of which admin is logged in. Stores the session URL in
 * Supabase and returns a short sessionId; the chunk endpoint uses that id.
 */
export async function POST(req: Request) {
  try {
    const { user, error } = await requireRole("admin", "superadmin");
    if (error) return error;

    let storageToken: string;
    try {
      storageToken = await getStorageAccountToken();
    } catch (e) {
      console.error("Storage account token error:", e);
      return NextResponse.json(
        { error: `Storage account not configured: ${(e as Error).message}` },
        { status: 500 },
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

    // The browser will PUT chunks DIRECTLY to Google (bypassing Vercel), so we
    // must bind the session to the caller's Origin. Google echoes this origin
    // back as Access-Control-Allow-Origin on the direct chunk uploads, which is
    // what makes cross-origin browser PUTs work. Without this, the browser's
    // direct upload is blocked by CORS.
    const browserOrigin = req.headers.get("origin");

    // Create resumable upload session as the storage account
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${storageToken}`,
          "content-type": "application/json; charset=UTF-8",
          "x-upload-content-type": mimeType,
          ...(parsed.fileSize ? { "x-upload-content-length": String(parsed.fileSize) } : {}),
          // Bind CORS to the browser's origin so it can upload chunks directly.
          ...(browserOrigin ? { origin: browserOrigin } : {}),
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Drive resumable session failed:", res.status, errText);
      return NextResponse.json(
        { error: `Drive session failed: ${res.status} — ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const uploadUrl = res.headers.get("location");
    if (!uploadUrl) {
      return NextResponse.json({ error: "Drive returned no upload URL" }, { status: 502 });
    }

    // Persist the session server-side; return only the short id to the client.
    const { data: sessionRow, error: insertErr } = await supabaseAdmin
      .from("upload_sessions")
      .insert({
        user_id: user.id || null,
        upload_url: uploadUrl,
        access_token: storageToken,
      })
      .select("id")
      .single();

    if (insertErr || !sessionRow) {
      console.error("Failed to store upload session:", insertErr);
      return NextResponse.json(
        { error: `Could not create upload session: ${insertErr?.message ?? "unknown"}. Have you run the 0005_upload_sessions migration?` },
        { status: 500 },
      );
    }

    // Return BOTH:
    //  - uploadUrl: the direct Google session URI so the browser uploads chunks
    //    straight to Google (fast path, no Vercel bandwidth/size limits).
    //  - sessionId: short id for the proxy fallback route (/api/drive/upload-chunk)
    //    used if a browser/network blocks the direct cross-origin PUT.
    return NextResponse.json({ sessionId: sessionRow.id, uploadUrl });
  } catch (e) {
    console.error("upload-start failed:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
