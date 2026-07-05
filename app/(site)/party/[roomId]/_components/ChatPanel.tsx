"use client";

import { useState } from "react";

export function ChatPanel(
  { chat, onSend }: {
    chat: { by: string; name: string; text: string; at: number }[];
    onSend: (text: string) => void;
  }
) {
  const [value, setValue] = useState("");
  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] lg:h-[calc(100vh-220px)]">
      <h3 className="border-b border-[color:var(--color-border-subtle)] px-3 py-2 text-xs font-semibold uppercase text-[color:var(--color-text-tertiary)]">
        Party chat
      </h3>
      <ul className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        {chat.length === 0 && (
          <li className="text-xs text-[color:var(--color-text-tertiary)]">No messages yet.</li>
        )}
        {chat.map((c, idx) => (
          <li key={idx} className="mb-2">
            <span className="text-[color:var(--color-brand)]">{c.name}</span>:{" "}
            <span className="text-[color:var(--color-text-primary)]">{c.text}</span>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            onSend(value.trim());
            setValue("");
          }
        }}
        className="flex gap-2 border-t border-[color:var(--color-border-subtle)] p-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Say something…"
          className="h-9 flex-1 rounded-full bg-[color:var(--color-surface-3)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
        />
        <button type="submit" className="rounded-full bg-[color:var(--color-brand)] px-3 text-xs font-medium text-white">Send</button>
      </form>
    </div>
  );
}
