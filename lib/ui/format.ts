/**
 * lib/ui/format.ts
 * Presentation formatting: duration, rating, file size, relative time,
 * error-message sanitization, saved-item metadata omission.
 * (Req 6.3, 10.2, 11.1, 19.2)
 */

/** Format a duration in seconds as floor(seconds/60) + "m". */
export function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(Math.max(0, durationSeconds) / 60);
  return `${minutes}m`;
}

/** Format a numeric rating with exactly one decimal place. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Format a file size in MB with exactly one decimal place. */
export function formatFileSize(sizeMb: number): string {
  return `${Math.max(0, sizeMb).toFixed(1)} MB`;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Human-readable relative time for a past date, e.g. "2 days ago".
 * Monotonic: an older date maps to an equal-or-larger time bucket.
 */
export function relativeTime(date: Date | string | number, now: Date | string | number = Date.now()): string {
  const then = new Date(date).getTime();
  const current = new Date(now).getTime();
  const diffMs = Math.max(0, current - then);

  if (diffMs < MINUTE) return "just now";
  if (diffMs < HOUR) {
    const m = Math.floor(diffMs / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < DAY) {
    const h = Math.floor(diffMs / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffMs < WEEK) {
    const d = Math.floor(diffMs / DAY);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  if (diffMs < MONTH) {
    const w = Math.floor(diffMs / WEEK);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  if (diffMs < YEAR) {
    const mo = Math.floor(diffMs / MONTH);
    return `${mo} month${mo === 1 ? "" : "s"} ago`;
  }
  const y = Math.floor(diffMs / YEAR);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

export interface SavedItemMetadataInput {
  year?: number | null;
  rating?: number | null;
  genres?: string[] | null;
}

export interface SavedItemMetadataViewModel {
  year?: number;
  rating?: number;
  genres?: string[]; // capped at 3
}

/**
 * Build a saved-item metadata view model: caps genres at 3, and omits
 * (rather than placeholder-renders) any missing field.
 */
export function toSavedItemMetadata(input: SavedItemMetadataInput): SavedItemMetadataViewModel {
  const out: SavedItemMetadataViewModel = {};
  if (typeof input.year === "number") out.year = input.year;
  if (typeof input.rating === "number") out.rating = input.rating;
  if (input.genres && input.genres.length > 0) out.genres = input.genres.slice(0, 3);
  return out;
}

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";
const MAX_ERROR_MESSAGE_LENGTH = 120;

/**
 * Sanitize a raw error string into a bounded, user-facing message:
 * - at most 120 characters
 * - no exposed HTTP status codes, URLs, or stack-trace markers
 * - non-empty fallback when input is empty/whitespace
 */
export function sanitizeErrorMessage(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) return FALLBACK_ERROR_MESSAGE;

  let msg = raw.trim();

  // Strip stack-trace markers and everything after them.
  msg = msg.split(/\n\s*at\s/)[0];
  msg = msg.replace(/\bat\s+[\w$.<>]+\s*\([^)]*\)/g, "");

  // Strip URLs.
  msg = msg.replace(/\bhttps?:\/\/\S+/gi, "");

  // Strip standalone HTTP status codes (e.g. "404", "Error 500", "500:").
  msg = msg.replace(/\b[1-5][0-9]{2}\b/g, "");

  // Strip common technical prefixes.
  msg = msg.replace(/^(Error|TypeError|RangeError|SyntaxError|NetworkError)\s*:?\s*/i, "");

  msg = msg.replace(/\s{2,}/g, " ").trim();
  msg = msg.replace(/^[:\-\s]+|[:\-\s]+$/g, "");

  if (msg.length === 0) return FALLBACK_ERROR_MESSAGE;

  if (msg.length > MAX_ERROR_MESSAGE_LENGTH) {
    msg = msg.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1).trimEnd() + "…";
  }

  return msg;
}
