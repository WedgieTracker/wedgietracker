import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Source-level guardrails for two intentional decisions in layout.tsx that
// automated lint cleanups have silently reverted before (see #108):
//   1. Analytics must be gated on VERCEL_ENV so localhost/preview hits never
//      reach the production GA4 property.
//   2. The consent-defaults script must stay a PLAIN inline <script>, never
//      next/script `beforeInteractive` — that crashes Safari under Next 16
//      cacheComponents (vercel/next.js#43383).
const layoutSrc = readFileSync(resolve(__dirname, "layout.tsx"), "utf8");

describe("layout.tsx analytics guardrails", () => {
  it('gates analytics on VERCEL_ENV === "production"', () => {
    expect(layoutSrc).toContain('process.env.VERCEL_ENV === "production"');
    expect(layoutSrc).toMatch(/analyticsEnabled\s*&&/);
  });

  it("does not gate analytics on NODE_ENV (pinned to production in .env.local)", () => {
    expect(layoutSrc).not.toMatch(/NODE_ENV.*===.*"production"/);
  });

  it("keeps the consent-defaults script as a plain inline <script>", () => {
    expect(layoutSrc).toMatch(
      /<script\s+dangerouslySetInnerHTML=\{\{ __html: consentDefaultsScript \}\}/,
    );
  });

  it("never reintroduces next/script beforeInteractive for the consent script", () => {
    expect(layoutSrc).not.toContain('from "next/script"');
    expect(layoutSrc).not.toContain('strategy="beforeInteractive"');
  });
});
