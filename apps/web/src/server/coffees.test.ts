import { describe, expect, it, vi } from "vitest";

const retrieve = vi.fn();
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/services/stripe", () => ({
  stripe: { checkout: { sessions: { retrieve } } },
}));
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
  revalidateTag: () => undefined,
}));

const { recordCoffeeCheckout } = await import("./coffees");

describe("recordCoffeeCheckout", () => {
  it("ignores anything that isn't a Checkout session id", async () => {
    expect(await recordCoffeeCheckout("not-a-session")).toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("doesn't count a checkout that isn't a paid coffee", async () => {
    retrieve.mockResolvedValueOnce({
      metadata: { coffee: "true" },
      payment_status: "unpaid",
      amount_subtotal: 300,
    });
    expect(await recordCoffeeCheckout("cs_test_123")).toBeNull();

    retrieve.mockResolvedValueOnce({
      metadata: {},
      payment_status: "paid",
      amount_subtotal: 300,
    });
    expect(await recordCoffeeCheckout("cs_test_456")).toBeNull();
  });

  it("never counts a test-mode payment", async () => {
    retrieve.mockResolvedValueOnce({
      livemode: false,
      metadata: { coffee: "true" },
      payment_status: "paid",
      amount_subtotal: 300,
    });
    expect(await recordCoffeeCheckout("cs_test_789")).toBeNull();
  });
});
