import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";

/**
 * PUT /api/drive/upload-chunk
 *
 * Receives a chunk of file data and forwards it to Google Drive's resumable
 * upload endpoint. Upload metadata is sent via custom headers to avoid
 * URL length issues on Vercel.
 *
 * Headers:
 *   x-upload-url: The Google resumable upload URL
 *   x-google-token: The user's Google access token
 *   x-chunk-start: Byte offset of this chunk
 *   x-chunk-end: Last byte index of this chunk (inclusive)
 *   x-file-total: Total file size in bytes
 *
 * Body: Raw chunk bytes (application/octet-stream)
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const uploadUrl = req.headers.get("x-upload-url");
  const googleToken = req.headers.get("x-google-token");
  const start = req.headers.get("x-chunk-start");
  const end = req.headers.get("x-chunk-end");
  const total = req.headers.get("x-file-total");

  if (!uploadUrl || !googleToken || !start || !end || !total) {
    return NextResponse.json(
      { error: "Missing headers: x-upload-url, x-google-token, x-chunk-start, x-chunk-end, x-file-total" },
      { status: 400 },
    );
  }

  const chunkBody = await req.arrayBuffer();
  const contentRange = `bytes ${start}-${end}/${total}`;

  const googleRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${googleToken}`,
      "content-length": String(chunkBody.byteLength),
      "content-range": contentRange,
    },
    body: chunkBody,
  });

  // 308 = Resume Incomplete (more chunks expected)
  if (googleRes.status === 308) {
    const range = googleRes.headers.get("range");
    return NextResponse.json({ done: false, range }, { status: 200 });
  }

  // 200/201 = Upload complete
  if (googleRes.ok) {
    const data = await googleRes.json().catch(() => ({})) as { id?: string };
    return NextResponse.json({ done: true, fileId: data.id ?? "" });
  }

  const errText = await googleRes.text();
  console.error("Drive chunk upload failed:", googleRes.status, errText.slice(0, 500));
  return NextResponse.json(
    { error: `Drive upload failed: ${googleRes.status}`, details: errText.slice(0, 500) },
    { status: googleRes.status >= 500 ? 502 : googleRes.status },
  );
}
