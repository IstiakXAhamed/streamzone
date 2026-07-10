"use client";

/**
 * components/admin/DataTable.tsx
 * Generic admin data table: alternating row shading, hover, sortable
 * headers via lib/ui/sort-like comparator injection, pagination (default
 * 20; 10/20/50) via lib/ui/pagination.ts. <768px converts to one-record
 * cards. (Req 13.3, 13.5)
 */

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { paginate } from "@/lib/ui/pagination";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  hideBelow?: "sm" | "md" | "lg"; // hide this column below the given breakpoint
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  defaultPageSize?: 10 | 20 | 50;
  /** Renders a mobile one-record card; falls back to a simple key/value list of columns if omitted. */
  renderMobileCard?: (row: T) => React.ReactNode;
}

const HIDE_CLASS: Record<NonNullable<DataTableColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records yet.",
  defaultPageSize = 20,
  renderMobileCard,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(defaultPageSize);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const withIndex = rows.map((row, index) => ({ row, index }));
    withIndex.sort((a, b) => {
      const av = col.sortValue!(a.row);
      const bv = col.sortValue!(b.row);
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      if (sortDir === "desc") cmp = -cmp;
      return cmp !== 0 ? cmp : a.index - b.index;
    });
    return withIndex.map((e) => e.row);
  }, [rows, sortKey, sortDir, columns]);

  const pages = useMemo(() => paginate(sortedRows, pageSize), [sortedRows, pageSize]);
  const currentPage = Math.min(page, Math.max(0, pages.length - 1));
  const pageRows = pages[currentPage] ?? [];

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] sm:block">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface-2)] text-[color:var(--color-text-tertiary)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-4 py-3",
                    col.align === "right" ? "text-right" : "text-left",
                    col.hideBelow ? HIDE_CLASS[col.hideBelow] : "",
                  ].join(" ")}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 hover:text-white"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp aria-hidden="true" size={12} />
                        ) : (
                          <ArrowDown aria-hidden="true" size={12} />
                        )
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[color:var(--color-text-tertiary)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={getRowKey(row)}
                  className={[
                    i % 2 === 0 ? "bg-[color:var(--color-surface-1)]" : "bg-[color:var(--color-surface-2)]",
                    "hover:bg-[color:var(--color-surface-3)]",
                  ].join(" ")}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        "px-4 py-3",
                        col.align === "right" ? "text-right" : "text-left",
                        col.hideBelow ? HIDE_CLASS[col.hideBelow] : "",
                      ].join(" ")}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile one-record cards */}
      <ul className="space-y-2 sm:hidden">
        {pageRows.length === 0 ? (
          <li className="rounded-xl border border-[color:var(--color-border-subtle)] p-4 text-center text-sm text-[color:var(--color-text-tertiary)]">
            {emptyMessage}
          </li>
        ) : (
          pageRows.map((row) => (
            <li key={getRowKey(row)} className="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
              {renderMobileCard ? (
                renderMobileCard(row)
              ) : (
                <dl className="space-y-1">
                  {columns.map((col) => (
                    <div key={col.key} className="flex justify-between gap-3 text-sm">
                      <dt className="text-[color:var(--color-text-tertiary)]">{col.header}</dt>
                      <dd className="text-right">{col.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))
        )}
      </ul>

      {rows.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-[color:var(--color-text-tertiary)]">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 10 | 20 | 50);
                setPage(0);
              }}
              className="rounded-md bg-[color:var(--color-surface-2)] px-2 py-1 text-[color:var(--color-text-primary)]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          {pages.length > 1 ? (
            <div className="flex gap-1">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-current={i === currentPage ? "page" : undefined}
                  className={["h-8 w-8 rounded-full text-xs", i === currentPage ? "bg-[color:var(--color-brand)] text-white" : "bg-[color:var(--color-surface-3)]"].join(" ")}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
