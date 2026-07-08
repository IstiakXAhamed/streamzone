import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireRole } from "@/lib/requireRole";

/**
 * PUT /api/drive/upload-chunk
 *
 * Receives a chunk of file data and forwards it to Google Drive's resumable
 * upload endpoint with proper Content-Range header. Each chunk must be under
 * 4MB to stay within Vercel's body size limit.
 *
 * Query params:
 *   - uploadUrl: The Google resumable upload URL (from upload-start)
 *   - start: Byte offset of this chunk
 *   - end: Last byte index of this chunk (inclusive)
 *   - total: Total file size in bytes
 *
 * Body: Raw chunk bytes
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const session = await getServerSession(authOptions);
  const googleAccessToken = (session as any)?.googleAccessToken as string | null;

  if (!googleAccessToken) {
    return NextResponse.json({ error: "No Google token" }, { status: 401 });
  }

  const uploadUrl = req.nextUrl.searchParams.get("uploadUrl");
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  const total = req.nextUrl.searchParams.get("total");

  if (!uploadUrl || !start || !end || !total) {
    return NextResponse.json({ error: "Missing query params: uploadUrl, start, end, total" }, { status: 400 });
  }

  const chunkBody = await req.arrayBuffer();
  const contentRange = `bytes ${start}-${end}/${total}`;

  const googleRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${googleAccessToken}`,
      "content-length": String(chunkBody.byteLength),
      "content-range": contentRange,
    },
    body: chunkBody,
  });

  // 308 = Resume Incomplete (more chunks expected)
  // 200/201 = Upload complete
  if (googleRes.status === 308) {
    const range = googleRes.headers.get("range");
    return NextResponse.json({ done: false, range }, { status: 200 });
  }

  if (googleRes.ok) {
    const data = await googleRes.json().catch(() => ({})) as { id?: string };
    return NextResponse.json({ done: true, fileId: data.id ?? "" });
  }

  const errText = await googleRes.text();
  console.error("Drive chunk upload failed:", googleRes.status, errText);
  return NextResponse.json(
    { error: `Drive upload failed: ${googleRes.status}`, details: errText.slice(0, 500) },
    { status: googleRes.status },
  );
}
