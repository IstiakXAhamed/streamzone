"use client";

/**
 * app/(site)/party/[roomId]/_components/ChatPanel.tsx
 * Rebuild: auto-scroll/unread via lib/ui/chat.ts with slide-up-fade entry;
 * chat input hard-capped 500 chars. Rendered as a side panel >=1024px by
 * the parent, or inside a Sheet <1024px.
 * (Req 8.2, 8.7)
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { MAX_MESSAGE_LENGTH, clampMessage, isValidMessage } from "@/lib/ui/chat";

export interface ChatMessage {
  by: string;
  name: string;
  text: string;
  at: number;
  system?: boolean;
}

const AT_BOTTOM_THRESHOLD_PX = 24;

export function ChatPanel({ chat, onSend }: { chat: ChatMessage[]; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const prevLength = useRef(chat.length);

  useEffect(() => {
    if (chat.length > prevLength.current) {
      if (isAtBottom) {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        setUnreadCount(0);
      } else {
        setUnreadCount((c) => c + (chat.length - prevLength.current));
      }
    }
    prevLength.current = chat.length;
  }, [chat, isAtBottom]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD_PX;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  }

  function scrollToBottom() {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    setIsAtBottom(true);
    setUnreadCount(0);
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] lg:h-[calc(100vh-220px)]">
      <h3 className="border-b border-[color:var(--color-border-subtle)] px-3 py-2 text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">
        Party chat
      </h3>
      <div className="relative flex-1 overflow-hidden">
        <ul ref={listRef} onScroll={handleScroll} className="h-full overflow-y-auto px-3 py-2 text-sm">
          {chat.length === 0 ? <li className="text-xs text-[color:var(--color-text-tertiary)]">No messages yet.</li> : null}
          <AnimatePresence initial={false}>
            {chat.map((c, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                className="mb-2"
              >
                {c.system ? (
                  <span className="text-xs italic text-[color:var(--color-text-tertiary)]">{c.text}</span>
                ) : (
                  <>
                    <span className="text-[color:var(--color-brand)]">{c.name}</span>:{" "}
                    <span className="text-[color:var(--color-text-primary)]">{c.text}</span>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {!isAtBottom && unreadCount > 0 ? (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[color:var(--color-brand)] px-3 py-1 text-xs font-medium text-white shadow-[var(--shadow-elevation-2)]"
          >
            <ArrowDown aria-hidden="true" size={12} />
            {unreadCount} new
          </button>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValidMessage(value)) {
            onSend(clampMessage(value));
            setValue("");
          }
        }}
        className="flex gap-2 border-t border-[color:var(--color-border-subtle)] p-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Say something…"
          aria-label="Chat message"
          className="h-9 flex-1 rounded-full bg-[color:var(--color-surface-3)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
        />
        <button
          type="submit"
          disabled={!isValidMessage(value)}
          className="rounded-full bg-[color:var(--color-brand)] px-3 text-xs font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
