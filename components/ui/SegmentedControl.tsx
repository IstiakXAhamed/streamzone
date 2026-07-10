"use client";

/**
 * components/ui/SegmentedControl.tsx
 * A compact single-select control (e.g. sort options) sharing the same
 * sliding-indicator pattern as Tabs but styled as a segmented button group.
 * (Req 7.4, 9.1, 16.3, 16.4)
 */

import { motion } from "framer-motion";
import { useRef } from "react";

export interface SegmentedOption {
  id: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
  "aria-label": string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  layoutId = "segmented-indicator",
  className = "",
  ...props
}: SegmentedControlProps) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % options.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + options.length) % options.length;

    if (nextIndex !== null) {
      e.preventDefault();
      const nextOption = options[nextIndex];
      onChange(nextOption.id);
      refs.current.get(nextOption.id)?.focus();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={[
        "inline-flex gap-1 rounded-full bg-[color:var(--color-surface-2)] p-1",
        className,
      ].join(" ")}
    >
      {options.map((option, index) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => {
              if (el) refs.current.set(option.id, el);
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 [transition-timing-function:var(--ease-out)]",
              isActive ? "text-[color:var(--color-brand-contrast)]" : "text-[color:var(--color-text-secondary)]",
            ].join(" ")}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-[color:var(--color-brand)]"
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
