/**
 * lib/ui/selection.ts
 * Batch-selection toggle set with count and set-consistent removal.
 * (Req 10.6)
 */

export function toggleSelection(selected: Set<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function selectionCount(selected: Set<string>): number {
  return selected.size;
}

/** Remove the selected items from `items`, keyed by `getId`. */
export function removeSelected<T>(items: T[], selected: Set<string>, getId: (item: T) => string): T[] {
  return items.filter((item) => !selected.has(getId(item)));
}
