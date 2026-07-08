import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { getUploadSession } from "@/app/api/drive/upload-start/route";

// Disable body size limit for video uploads
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large files

/**
 * PUT /api/drive/upload-proxy?sessionId=xxx
 *
 * Streams the request body directly to Google Drive's resumable upload URL,
 * attaching the service account's access token. This avoids CORS issues since
 * the browser talks to our origin, and we relay to Google with proper auth.
 *
 * Returns the Google response (which includes the file's `id` on completion).
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = getUploadSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Upload session not found or expired" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = req.headers.get("content-length");

  // Build headers for the Google PUT
  const googleHeaders: Record<string, string> = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": contentType,
  };
  if (contentLength) {
    googleHeaders["content-length"] = contentLength;
  }

  // Stream the body directly to Google
  const googleRes = await fetch(session.uploadUrl, {
    method: "PUT",
    headers: googleHeaders,
    body: req.body as ReadableStream<Uint8Array>,
    // @ts-expect-error -- Node fetch supports duplex streaming
    duplex: "half",
  });

  const responseBody = await googleRes.text();

  if (!googleRes.ok) {
    return NextResponse.json(
      { error: `Drive upload failed: ${googleRes.status}`, details: responseBody.slice(0, 500) },
      { status: googleRes.status },
    );
  }

  // Google returns { id, name, ... } on successful completion
  let fileData: { id?: string } = {};
  try {
    fileData = JSON.parse(responseBody) as typeof fileData;
  } catch { /* empty */ }

  return NextResponse.json({ ok: true, fileId: fileData.id ?? "", raw: responseBody });
}
