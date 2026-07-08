/**
 * Lightweight Google Drive helpers.
 *
 * At runtime this module exposes a single function used by API routes to build
 * a direct stream URL for a given Drive file id. The actual fetch is made by
 * the browser against Google — our server never transports the bytes.
 */

let cachedSaKey: Record<string, unknown> | null = null;

function getServiceAccount(): Record<string, unknown> {
  if (cachedSaKey) return cachedSaKey;
  let b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set");
  // strip any whitespace/newlines that may have crept in via copy-paste
  b64 = b64.replace(/\s+/g, "");
  cachedSaKey = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<
    string,
    unknown
  >;
  return cachedSaKey;
}

/** A Google service-account access token scoped to full Drive access (upload + read). */
export async function getAccessToken(): Promise<string> {
  const sa = getServiceAccount();
  const saEmail = sa.client_email as string;
  const saPrivateKey = sa.private_key as string;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: saEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const toB64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  // dynamic import keeps this function usable in route handlers without large SSR cost
  const { createSign } = await import("node:crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(`${toB64(header)}.${toB64(payload)}`);
  const jwt = `${toB64(header)}.${toB64(payload)}.${signer.sign(
    saPrivateKey,
    "base64url",
  )}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenText = await tokenRes.text();
  let data: { access_token?: string; error?: string };
  try {
    data = JSON.parse(tokenText) as typeof data;
  } catch {
    throw new Error(`Drive token endpoint returned non-HTTP ${tokenRes.status}: ${tokenText.slice(0, 200)}`);
  }
  if (!data.access_token) {
    throw new Error(`Drive token failed: ${data.error ?? "unknown"} — ${tokenText.slice(0, 200)}`);
  }
  return data.access_token;
}

/**
 * Build a direct stream URL.
 *  - `readFromServiceAccount` — signed, idempotent. Works even when the file
 *    is not public (we recommend staying "anyone with link" for simplicity and
 *    to keep our host out of the byte path).
 */
export async function getDriveFileStreamUrl(
  fileId: string,
  opts: { readFromServiceAccount?: boolean } = {},
): Promise<string> {
  if (opts.readFromServiceAccount) {
    const token = await getAccessToken();
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true&access_token=${token}`;
  }
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY is missing");
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true&key=${apiKey}`;
}

/**
 * Create a Drive resumable-upload session. Returns a resumable upload URL that
 * includes the access token as a query parameter, allowing the browser to PUT
 * bytes directly to Google without needing an Authorization header.
 *
 * This avoids Vercel's body size limits since bytes go browser → Google directly.
 */
export async function createResumableUploadSession(input: {
  name: string;
  mimeType?: string;
  parentFolderId?: string;
  origin?: string;
}): Promise<{ uploadUrl: string }> {
  const token = await getAccessToken();
  const metadata: Record<string, unknown> = { name: input.name };
  if (input.parentFolderId) metadata.parents = [input.parentFolderId];

  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json; charset=UTF-8",
    "x-upload-content-type": input.mimeType ?? "application/octet-stream",
  };
  // The origin header tells Google which browser origin to whitelist in CORS
  // responses on the resumable PUT URL.
  if (input.origin) {
    headers["origin"] = input.origin;
  }

  // supportsAllDrives=true lets the service account write into folders that
  // belong to a user's My Drive or a Shared Drive (the SA itself has no quota).
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
    throw new Error(`Drive resumable session failed: ${res.status} ${errText.slice(0, 200)}`);
  }
  const locationUrl = res.headers.get("location");
  if (!locationUrl) throw new Error("Drive resumable session returned no Location header");

  // Append the access token to the resumable URL so the browser can PUT
  // without an Authorization header (Google accepts token via query param).
  const separator = locationUrl.includes("?") ? "&" : "?";
  const uploadUrl = `${locationUrl}${separator}access_token=${encodeURIComponent(token)}`;

  return { uploadUrl };
}

/**
 * Confirm a Drive upload finished and return the file's metadata (id, name,
 * size, thumbnailLink) so the client can store the fileId in Supabase.
 */
export async function finalizeUpload(
  fileId: string,
): Promise<{ id: string; name: string; size: number | null; mimeType: string; thumbnailLink: string | null }> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,thumbnailLink&supportsAllDrives=true`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Drive finalize failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    id: string; name: string; size?: string; mimeType: string; thumbnailLink?: string;
  };
  return {
    id: data.id,
    name: data.name,
    size: data.size ? Number(data.size) : null,
    mimeType: data.mimeType,
    thumbnailLink: data.thumbnailLink ?? null,
  };
}
