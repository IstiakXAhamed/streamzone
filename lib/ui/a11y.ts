/**
 * lib/ui/a11y.ts
 * isValidAltText (meaningful 5-150, decorative exactly "") and
 * isValidIconLabel (>=3). (Req 16.5)
 */

export function isValidAltText(alt: string, kind: "meaningful" | "decorative"): boolean {
  if (kind === "decorative") return alt === "";
  return alt.length >= 5 && alt.length <= 150;
}

export function isValidIconLabel(label: string): boolean {
  return label.trim().length >= 3;
}
