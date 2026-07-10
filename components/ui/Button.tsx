"use client";

/**
 * components/ui/Button.tsx
 * Token-driven Button and IconButton primitives.
 * (Req 6.4, 6.5, 20.5, 16.5)
 */

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { scalePress } from "@/lib/motion/variants";

export type ButtonVariant = "brand" | "surface" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  brand:
    "bg-[color:var(--color-brand)] text-[color:var(--color-brand-contrast)] hover:brightness-110 focus-visible:outline-[color:var(--color-brand)]",
  surface:
    "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-4)] focus-visible:outline-[color:var(--color-brand)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-3)] focus-visible:outline-[color:var(--color-brand)]",
  danger:
    "bg-[color:var(--color-error)] text-[color:var(--color-error-contrast)] hover:brightness-110 focus-visible:outline-[color:var(--color-error)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "surface", size = "md", pill = false, loading = false, disabled, className = "", children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || loading}
      variants={scalePress}
      initial="rest"
      whileTap="pressed"
      className={[
        "inline-flex items-center justify-center font-medium",
        "transition-colors duration-150 [transition-timing-function:var(--ease-out)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        pill ? "rounded-full" : "rounded-[var(--radius-md)]",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </motion.button>
  );
});

export interface IconButtonProps extends ButtonProps {
  "aria-label": string; // required — icon-only buttons must have a meaningful label (Req 16.5)
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = "md", className = "", children, ...props },
  ref,
) {
  const iconSizeClasses: Record<ButtonSize, string> = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Button ref={ref} size={size} className={["p-0", iconSizeClasses[size], className].join(" ")} {...props}>
      {children}
    </Button>
  );
});
