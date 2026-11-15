// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const handleAppStoreNotification = vi.fn();
vi.mock("~/server/app-store-notifications", () => ({
  handleAppStoreNotification,
}));

const { POST } = await import("./route");

const url = "https://www.wedgietracker.com/api/app-store/notifications";
const post = (body: string) => POST(new Request(url, { method: "POST", body }));

describe("/api/app-store/notifications", () => {
  beforeEach(() => {
    handleAppStoreNotification.mockReset();
  });

  it("answers 200 for a verified notification", async () => {
    handleAppStoreNotification.mockResolvedValue({
      status: "refunded",
      coffees: 3,
    });
    const res = await post(JSON.stringify({ signedPayload: "a.b.c" }));
    expect(res.status).toBe(200);
    expect(handleAppStoreNotification).toHaveBeenCalledWith("a.b.c");
  });

  it("answers 200 for one it ignores, so Apple doesn't retry", async () => {
    handleAppStoreNotification.mockResolvedValue({
      status: "ignored",
      reason: "not-handled",
    });
    expect(
      (await post(JSON.stringify({ signedPayload: "a.b.c" }))).status,
    ).toBe(200);
  });

  it("answers 400 for one that doesn't verify", async () => {
    handleAppStoreNotification.mockResolvedValue({
      status: "rejected",
      reason: "invalid",
    });
    expect(
      (await post(JSON.stringify({ signedPayload: "a.b.c" }))).status,
    ).toBe(400);
  });

  it("answers 400 without a signedPayload", async () => {
    for (const body of ["", "nope", "null", "{}", '{"signedPayload":1}']) {
      expect((await post(body)).status).toBe(400);
    }
    expect(handleAppStoreNotification).not.toHaveBeenCalled();
  });
});
