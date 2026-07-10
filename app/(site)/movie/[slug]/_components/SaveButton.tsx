"use client";

/**
 * app/(site)/movie/[slug]/_components/SaveButton.tsx
 * Optimistic save/unsave wired through lib/ui/optimistic.ts: applies
 * immediately, reverts + shows an error toast if the server doesn't
 * confirm within 10s or returns an error. (Req 17.2)
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { applyOptimistic, confirm, revert, type OptimisticEntry } from "@/lib/ui/optimistic";
import { saveBounce } from "@/lib/motion/variants";

const CONFIRMATION_TIMEOUT_MS = 10000;

export function SaveButton({ movieId, title, initialSaved = false }: { movieId: string; title: string; initialSaved?: boolean }) {
  const { push } = useToast();
  const [entry, setEntry] = useState<OptimisticEntry<boolean>>({ previous: initialSaved, applied: initialSaved, confirmed: true });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function toggle() {
    const nextValue = !entry.applied;
    const optimisticEntry = applyOptimistic(entry.applied, nextValue);
    setEntry(optimisticEntry);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setEntry((current) => revert(current));
      push({ kind: "error", message: `Couldn't ${nextValue ? "save" : "remove"} "${title}". Please try again.` });
    }, CONFIRMATION_TIMEOUT_MS);

    try {
      const endpoint = nextValue ? "/api/offline/save" : "/api/offline/remove";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, title }),
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!res.ok) throw new Error("request failed");
      setEntry((current) => confirm(current));
      push({ kind: "success", message: nextValue ? "Saved" : "Removed from Saved" });
    } catch {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setEntry((current) => revert(current));
      push({ kind: "error", message: `Couldn't ${nextValue ? "save" : "remove"} "${title}". Please try again.` });
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      variants={saveBounce}
      initial="rest"
      animate={entry.applied ? "bounce" : "rest"}
      className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-3)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-text-primary)] transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[color:var(--color-surface-4)]"
      aria-pressed={entry.applied}
    >
      {entry.applied ? <BookmarkCheck aria-hidden="true" className="h-4 w-4" /> : <Bookmark aria-hidden="true" className="h-4 w-4" />}
      {entry.applied ? "Saved" : "Save"}
    </motion.button>
  );
}
