"use client";

/**
 * app/(site)/party/[roomId]/_components/ParticipantStrip.tsx
 * Participant avatars via visibleAvatars (<=8 + "+N"), online dots, host
 * crown, join/leave scale in/out animation. (Req 8.3, 8.4)
 */

import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";
import { visibleAvatars } from "@/lib/ui/avatars";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

export function ParticipantStrip({ participants }: { participants: Participant[] }) {
  const { visible, overflowCount, showOverflow } = visibleAvatars(participants);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3">
      <h3 className="text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">
        In the room ({participants.length})
      </h3>
      <div className="ml-auto flex items-center -space-x-2">
        <AnimatePresence initial={false}>
          {visible.map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-[color:var(--color-surface-1)] bg-[color:var(--color-surface-3)] text-xs font-semibold"
              title={p.name}
            >
              {p.name.slice(0, 1).toUpperCase()}
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--color-surface-1)] bg-[color:var(--color-success)]"
              />
              {p.isHost ? (
                <Crown aria-hidden="true" className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 text-[color:var(--color-warning)]" />
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
        {showOverflow ? (
          <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-[color:var(--color-surface-1)] bg-[color:var(--color-surface-4)] text-xs font-semibold">
            +{overflowCount}
          </div>
        ) : null}
      </div>
    </div>
  );
}
