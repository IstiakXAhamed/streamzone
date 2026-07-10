"use client";

/**
 * components/search/SearchOverlay.tsx
 * Full-screen (mobile) / dropdown (desktop) search overlay with backdrop
 * blur; <=5 recent searches; >=2 chars -> debounced (300ms) <=10 results
 * via matches(); title highlight via highlightRanges; empty state <=6
 * trending suggestions; select navigates + 150ms fade-out; Escape/backdrop/
 * back dismiss without navigating; error state retains query text.
 * (Req 18.1-18.7, 19.1)
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search as SearchIcon, X } from "lucide-react";
import { createPortal } from "react-dom";
import { FocusTrap } from "@/components/layout/FocusTrap";
import { Media } from "@/components/ui/Media";
import { addRecentSearch, highlightRanges } from "@/lib/ui/search";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  poster_url: string | null;
}

const RECENT_SEARCHES_KEY = "mz:recent-searches";
const DEBOUNCE_MS = 300;
const MAX_TRENDING = 6;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, quota) — recents just won't persist.
  }
}

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setRecents(readRecents());
      fetch("/api/movies/list?limit=6")
        .then((r) => r.json())
        .then((data) => setTrending((data.movies ?? []).slice(0, MAX_TRENDING)))
        .catch(() => setTrending([]));
    } else {
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data.movies ?? []);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  function selectResult(result: SearchResult) {
    const nextRecents = addRecentSearch(recents, result.title);
    writeRecents(nextRecents);
    router.push(`/movie/${result.slug}`);
    onClose();
  }

  function selectRecent(term: string) {
    setQuery(term);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <FocusTrap active={open} onClose={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="mx-auto mt-0 flex h-full w-full flex-col bg-[color:var(--color-surface-1)] p-4 sm:mt-20 sm:h-auto sm:max-w-lg sm:rounded-[var(--radius-lg)] sm:p-6 sm:shadow-[var(--shadow-elevation-3)]"
            >
              <div className="flex items-center gap-2">
                <SearchIcon aria-hidden="true" className="h-5 w-5 text-[color:var(--color-text-tertiary)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies and series…"
                  aria-label="Search movies and series"
                  className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--color-text-tertiary)]"
                />
                <button type="button" aria-label="Close search" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--color-surface-3)]">
                  <X aria-hidden="true" size={16} />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto">
                {status === "error" ? (
                  <p className="py-8 text-center text-sm text-[color:var(--color-text-secondary)]">
                    Search is temporarily unavailable. Your search text has been kept — try again shortly.
                  </p>
                ) : query.trim().length < 2 ? (
                  <>
                    {recents.length > 0 ? (
                      <div className="mb-6">
                        <p className="mb-2 text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">Recent</p>
                        <ul className="flex flex-wrap gap-2">
                          {recents.slice(0, 5).map((term) => (
                            <li key={term}>
                              <button
                                onClick={() => selectRecent(term)}
                                className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1 text-sm hover:bg-[color:var(--color-surface-4)]"
                              >
                                {term}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {trending.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">Trending</p>
                        <ul className="space-y-2">
                          {trending.map((m) => (
                            <li key={m.id}>
                              <button onClick={() => selectResult(m)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[color:var(--color-surface-3)]">
                                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                                  <Media src={m.poster_url} alt={m.title} fill sizes="40px" />
                                </div>
                                <span className="text-sm">{m.title}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[color:var(--color-text-secondary)]">No results for &quot;{query}&quot;.</p>
                    {trending.length > 0 ? (
                      <ul className="mt-4 space-y-2 text-left">
                        {trending.map((m) => (
                          <li key={m.id}>
                            <button onClick={() => selectResult(m)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[color:var(--color-surface-3)]">
                              <span className="text-sm">{m.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {results.map((m) => {
                      const segments = highlightRanges(m.title, query.trim());
                      return (
                        <li key={m.id}>
                          <button onClick={() => selectResult(m)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[color:var(--color-surface-3)]">
                            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                              <Media src={m.poster_url} alt={m.title} fill sizes="40px" />
                            </div>
                            <span className="text-sm">
                              {segments.map((seg, i) => (seg.highlighted ? <strong key={i}>{seg.text}</strong> : <span key={i}>{seg.text}</span>))}
                              {m.year ? <span className="ml-1 text-[color:var(--color-text-tertiary)]">({m.year})</span> : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </FocusTrap>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
