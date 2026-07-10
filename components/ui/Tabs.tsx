"use client";

/**
 * components/ui/Tabs.tsx
 * role="tablist", arrow-key navigation, sliding active indicator via
 * framer-motion layoutId (200ms). (Req 7.4, 9.1, 16.3, 16.4)
 */

import { motion } from "framer-motion";
import { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

export function Tabs({ tabs, active, onChange, layoutId = "tabs-indicator", className = "" }: TabsProps) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      onChange(nextTab.id);
      refs.current.get(nextTab.id)?.focus();
    }
  }

  return (
    <div role="tablist" className={["relative flex gap-1", className].join(" ")}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 [transition-timing-function:var(--ease-out)]",
              isActive ? "text-[color:var(--color-text-primary)]" : "text-[color:var(--color-text-secondary)]",
            ].join(" ")}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-[color:var(--color-surface-3)]"
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
