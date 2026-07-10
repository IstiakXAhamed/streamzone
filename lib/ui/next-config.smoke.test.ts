import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Integration / smoke test (Req 14.1, 17.1): asserts next.config.ts enables
 * experimental.viewTransition and defines images.qualities, guarding the
 * Next.js 16 requirements this overhaul depends on.
 */
describe("next.config.ts smoke test", () => {
  const configSource = fs.readFileSync(path.resolve(__dirname, "../../next.config.ts"), "utf-8");

  it("enables experimental.viewTransition", () => {
    expect(configSource).toMatch(/viewTransition:\s*true/);
  });

  it("defines images.qualities", () => {
    expect(configSource).toMatch(/qualities:\s*\[[^\]]*\]/);
  });

  it("defines images.remotePatterns for remote poster/backdrop hosts", () => {
    expect(configSource).toMatch(/remotePatterns:\s*\[/);
  });
});
