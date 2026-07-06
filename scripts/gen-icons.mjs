// Generate placeholder PWA icons. Run: node scripts/gen-icons.mjs
// Replace the output with your own branded PNGs when ready.
// This creates a proper red "MZ" icon on black background.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Generate a simple SVG and embed as data URI fallback, plus a minimal valid PNG.
// For production, replace with real PNGs (192x192 and 512x512).
for (const size of [192, 512]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#000"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${size * 0.4}" fill="#e50914">MZ</text>
  </svg>`;
  writeFileSync(join(outDir, `icon-${size}.svg`), svg);
  console.log(`wrote icon-${size}.svg`);
}

// Also write a tiny valid PNG so the PNG manifest entry doesn't 404.
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==",
  "base64",
);
for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png1x1);
  console.log(`wrote icon-${size}.png (placeholder — replace with exported PNG from the SVG above)`);
}
