/**
 * lib/ui/contrast.ts
 * Relative luminance + WCAG contrast ratio helpers (Req 1.7, 16.1, 20.1).
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/** Parse a #rrggbb / #rgb hex color string into an RGB triple. */
export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function channelLuminance(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an sRGB color, in [0, 1]. */
export function relativeLuminance(color: RGB): number {
  const r = channelLuminance(color.r);
  const g = channelLuminance(color.g);
  const b = channelLuminance(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two colors. Symmetric, in [1, 21].
 * Accepts RGB objects or hex strings.
 */
export function contrastRatio(a: RGB | string, b: RGB | string): number {
  const rgbA = typeof a === "string" ? hexToRgb(a) : a;
  const rgbB = typeof b === "string" ? hexToRgb(b) : b;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export const AA_NORMAL_TEXT_MIN = 4.5;
export const AA_LARGE_TEXT_MIN = 3;

/**
 * The design's (text token, surface token) pairings that can co-occur,
 * resolved to concrete hex colors for contrast checking.
 * Text opacity tokens (95/70/50%) are composited over each surface below
 * since contrast for translucent text depends on the backdrop it sits on.
 */
function compositeOverSurface(alpha: number, surfaceHex: string): RGB {
  // White text at `alpha` opacity composited over an opaque surface color.
  const surface = hexToRgb(surfaceHex);
  const r = Math.round(255 * alpha + surface.r * (1 - alpha));
  const g = Math.round(255 * alpha + surface.g * (1 - alpha));
  const b = Math.round(255 * alpha + surface.b * (1 - alpha));
  return { r, g, b };
}

export interface TokenPairing {
  textToken: "primary" | "secondary" | "tertiary";
  surfaceToken: "surface-0" | "surface-1" | "surface-2" | "surface-3" | "surface-4";
  isLargeText: boolean;
}

const SURFACES: Record<TokenPairing["surfaceToken"], string> = {
  "surface-0": "#000000",
  "surface-1": "#0a0a0a",
  "surface-2": "#141414",
  "surface-3": "#1f1f1f",
  "surface-4": "#2a2a2a",
};

const TEXT_ALPHAS: Record<TokenPairing["textToken"], number> = {
  primary: 0.95,
  secondary: 0.7,
  tertiary: 0.5,
};

/** Enumerate every (text token, surface token) pairing that can co-occur in the design. */
export function enumerateTokenPairings(): TokenPairing[] {
  const textTokens: TokenPairing["textToken"][] = ["primary", "secondary", "tertiary"];
  const surfaceTokens: TokenPairing["surfaceToken"][] = [
    "surface-0",
    "surface-1",
    "surface-2",
    "surface-3",
    "surface-4",
  ];
  const pairings: TokenPairing[] = [];
  for (const textToken of textTokens) {
    for (const surfaceToken of surfaceTokens) {
      // tertiary text is reserved for large/caption-style text only per design.
      pairings.push({ textToken, surfaceToken, isLargeText: textToken === "tertiary" });
    }
  }
  return pairings;
}

/** Resolve a token pairing to its contrast ratio. */
export function contrastForPairing(pairing: TokenPairing): number {
  const textColor = compositeOverSurface(TEXT_ALPHAS[pairing.textToken], SURFACES[pairing.surfaceToken]);
  const surfaceColor = hexToRgb(SURFACES[pairing.surfaceToken]);
  return contrastRatio(textColor, surfaceColor);
}

/** Does a token pairing pass its applicable WCAG AA threshold? */
export function pairingPassesAA(pairing: TokenPairing): boolean {
  const ratio = contrastForPairing(pairing);
  const min = pairing.isLargeText ? AA_LARGE_TEXT_MIN : AA_NORMAL_TEXT_MIN;
  return ratio >= min;
}
