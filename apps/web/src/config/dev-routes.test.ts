import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse since it's a server-only API
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init: { status: number }) => ({
      body,
      status: init.status,
    }),
  },
}));

describe("assertDevMode", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { assertDevMode } = await import("./dev-routes");
    expect(assertDevMode()).toBeNull();
  });

  it("returns 404 response in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { assertDevMode } = await import("./dev-routes");
    const result = assertDevMode();
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      body: { error: "Not available in production" },
      status: 404,
    });
  });

  it("returns 404 response in test mode", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { assertDevMode } = await import("./dev-routes");
    const result = assertDevMode();
    expect(result).not.toBeNull();
  });
});

describe("isDev", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("is true in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { isDev } = await import("./dev-routes");
    expect(isDev).toBe(true);
  });

  it("is false in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { isDev } = await import("./dev-routes");
    expect(isDev).toBe(false);
  });
});
