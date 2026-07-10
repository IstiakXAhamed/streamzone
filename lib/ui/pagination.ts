/**
 * lib/ui/pagination.ts
 * paginate(items, pageSize) — partition without loss/duplication.
 * (Req 10.7, 13.3)
 */

export function paginate<T>(items: T[], pageSize = 50): T[][] {
  if (pageSize <= 0) return items.length === 0 ? [] : [items.slice()];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}
