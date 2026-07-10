/**
 * lib/ui/search.ts
 * matches, highlightRanges, groupByRecency, recent-search history.
 * (Req 11.5, 18.1, 18.2, 18.3)
 */

export interface SearchableTitle {
  id: string;
  title: string;
}

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

/** Case-insensitive substring match, gated at >=2 chars, capped at 10 results. */
export function matches<T extends SearchableTitle>(query: string, items: T[]): T[] {
  if (query.length < MIN_QUERY_LENGTH) return [];
  const q = query.toLowerCase();
  return items.filter((item) => item.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Split `title` into segments that rejoin (in order) to reproduce the
 * original title exactly; segments matching `query` case-insensitively are
 * marked highlighted, non-overlapping.
 */
export function highlightRanges(title: string, query: string): HighlightSegment[] {
  if (!query) return [{ text: title, highlighted: false }];

  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.length === 0) return [{ text: title, highlighted: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  while (cursor < title.length) {
    const idx = lowerTitle.indexOf(lowerQuery, cursor);
    if (idx === -1) {
      segments.push({ text: title.slice(cursor), highlighted: false });
      break;
    }
    if (idx > cursor) {
      segments.push({ text: title.slice(cursor, idx), highlighted: false });
    }
    segments.push({ text: title.slice(idx, idx + lowerQuery.length), highlighted: true });
    cursor = idx + lowerQuery.length;
  }

  if (segments.length === 0) segments.push({ text: title, highlighted: false });

  return segments;
}

export interface RecencyItem {
  timestamp: string | number | Date;
}

export interface RecencyGroups<T> {
  today: T[];
  thisWeek: T[];
  earlier: T[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Partition items into Today / This Week / Earlier buckets by age. */
export function groupByRecency<T extends RecencyItem>(items: T[], now: Date | number | string = Date.now()): RecencyGroups<T> {
  const nowMs = new Date(now).getTime();
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  const groups: RecencyGroups<T> = { today: [], thisWeek: [], earlier: [] };

  for (const item of items) {
    const ts = new Date(item.timestamp).getTime();
    const age = nowMs - ts;
    if (ts >= startOfToday) {
      groups.today.push(item);
    } else if (age <= WEEK_MS) {
      groups.thisWeek.push(item);
    } else {
      groups.earlier.push(item);
    }
  }

  return groups;
}

const MAX_RECENT_SEARCHES = 5;

/**
 * Add `term` to a recent-search history list: dedup, cap at 5, move
 * re-searched terms to the front without growing the list.
 */
export function addRecentSearch(history: string[], term: string): string[] {
  const trimmed = term.trim();
  if (trimmed.length === 0) return history;
  const withoutDup = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
  return [trimmed, ...withoutDup].slice(0, MAX_RECENT_SEARCHES);
}
