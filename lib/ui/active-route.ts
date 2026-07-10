/**
 * lib/ui/active-route.ts
 * isTabActive(pathname, tabRoot) — full path-segment prefix matching.
 * (Req 3.2, 3.7)
 */

/** Normalize a path by stripping a trailing slash (except for the root "/"). */
function normalize(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/**
 * Is `tabRoot` active for `pathname`? Active iff `tabRoot` equals `pathname`
 * or is a full path-segment prefix of it. The root tab ("/") matches only
 * the exact "/" pathname (never treated as a prefix of every route).
 */
export function isTabActive(pathname: string, tabRoot: string): boolean {
  const path = normalize(pathname);
  const root = normalize(tabRoot);

  if (root === "/") return path === "/";

  if (path === root) return true;

  return path.startsWith(root + "/");
}

/** Given a set of tab roots, find the single active tab id (or null). */
export function findActiveTab<T extends { root: string }>(pathname: string, tabs: T[]): T | null {
  const active = tabs.filter((tab) => isTabActive(pathname, tab.root));
  return active[0] ?? null;
}
