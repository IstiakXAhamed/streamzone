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
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set");
  cachedSaKey = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<
    string,
    unknown
  >;
  return cachedSaKey;
}

/** A Google service-account access token scoped to Drive readonly. */
async function getAccessToken(): Promise<string> {
  const sa = getServiceAccount();
  const saEmail = sa.client_email as string;
  const saPrivateKey = sa.private_key as string;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: saEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
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
  const data = (await tokenRes.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error(`Drive token failed: ${JSON.stringify(data)}`);
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
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token}`;
  }
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY is missing");
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
}
