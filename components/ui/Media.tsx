"use client";

/**
 * components/ui/Media.tsx
 * The single image entry point. Wraps next/image with fill/sizes, an
 * onLoad fade-in reveal, an onError/missing-src fallback graphic, and
 * `preload` + fetchPriority="high" for LCP images (never the deprecated
 * `priority` prop). Falls back to `unoptimized` for hosts not present in
 * `images.remotePatterns` (dynamic Drive/CDN URLs) so remote posters never
 * hit the Next.js 400 image-optimizer rejection.
 * (Req 5.4, 5.5, 6.2, 17.1)
 */

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export type MediaRatio = "2/3" | "16/9" | "1/1";

const RATIO_CLASSES: Record<MediaRatio, string> = {
  "2/3": "aspect-[2/3]",
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
};

// Hosts allow-listed in next.config.ts images.remotePatterns. Kept in sync
// manually since Next.js does not expose the resolved config at runtime.
const OPTIMIZABLE_HOSTS = ["drive.google.com", "googleusercontent.com", "lh3.googleusercontent.com"];

function isOptimizableHost(src: string): boolean {
  if (src.startsWith("/")) return true; // local/static asset
  try {
    const url = new URL(src);
    return OPTIMIZABLE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export interface MediaProps
  extends Omit<ImageProps, "src" | "alt" | "onLoad" | "onError" | "priority" | "placeholder"> {
  src: string | null | undefined;
  alt: string;
  ratio?: MediaRatio;
  /** LCP images: adds a <link preload> and fetchPriority="high" instead of the deprecated `priority`. */
  preload?: boolean;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export function Media({
  src,
  alt,
  ratio,
  preload = false,
  fallback,
  className = "",
  containerClassName = "",
  fill = true,
  sizes = "100vw",
  quality,
  ...imageProps
}: MediaProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const showFallback = !src || errored;

  return (
    <div
      className={[
        "relative overflow-hidden bg-[color:var(--color-surface-2)]",
        ratio ? RATIO_CLASSES[ratio] : "",
        containerClassName,
      ].join(" ")}
    >
      {showFallback ? (
        fallback ?? (
          <div className="grid h-full w-full place-items-center text-[color:var(--color-text-tertiary)]">
            <ImageOff aria-hidden="true" className="h-8 w-8" />
          </div>
        )
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          quality={quality}
          unoptimized={!isOptimizableHost(src)}
          preload={preload}
          fetchPriority={preload ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={[
            "object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          ].join(" ")}
          {...imageProps}
        />
      )}
    </div>
  );
}
