import { describe, it, expect, afterEach } from "vitest";
import { isAllowedEmail } from "./allowlist";

describe("isAllowedEmail", () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it("lets nobody in when ADMIN_EMAILS is unset", () => {
    expect(isAllowedEmail("admin@example.com")).toBe(false);
  });

  it("matches listed emails exactly, ignoring case and spacing", () => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , other@example.com";
    expect(isAllowedEmail("admin@example.com")).toBe(true);
    expect(isAllowedEmail("OTHER@example.com")).toBe(true);
    expect(isAllowedEmail("xadmin@example.com")).toBe(false);
    expect(isAllowedEmail("admin@example.com.evil")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
  });
});
