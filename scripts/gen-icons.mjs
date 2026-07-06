// Generate placeholder PWA icons (red "MZ" on black). Run: node scripts/gen-icons.mjs
// Requires `npm install sharp` once, or replace with your own PNGs.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Minimal valid 1x1 transparent PNG (acts as a harmless placeholder).
// Replace icon-192.png and icon-512.png with your own branded PNGs later.
const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==",
  "base64",
);

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), transparentPng);
  console.log(`wrote icon-${size}.png (placeholder — replace with your brand logo)`);
}
