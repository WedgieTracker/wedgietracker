import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// --- Mocks ----------------------------------------------------------------
// Every import in route.ts that reaches env validation, the network, or the
// DB has to be stubbed before the module loads.

const headersGet = vi.fn<(name: string) => string | null>();
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: headersGet }),
}));

const constructEvent = vi.fn<() => Stripe.Event>();
vi.mock("~/server/services/stripe", () => ({
  stripe: { webhooks: { constructEvent } },
}));

const sendTelegramMessage = vi.fn();
vi.mock("~/server/services/telegram", () => ({ sendTelegramMessage }));

const sendDonationConfirmationEmail = vi.fn();
vi.mock("~/server/services/email", () => ({ sendDonationConfirmationEmail }));

const { POST } = await import("./route");

// --- Fixtures -------------------------------------------------------------

function makeRequest(body = "raw-body") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
  });
}

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    amount_total: 2500,
    customer_details: { email: "buyer@example.com", name: "Jane Buyer" },
    metadata: { coffee: "true" },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function checkoutCompletedEvent(
  session: Stripe.Checkout.Session,
): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: { object: session },
  } as unknown as Stripe.Event;
}

// --- Tests ----------------------------------------------------------------

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    headersGet.mockReturnValue("sig_test");
  });

  describe("request validation", () => {
    it("returns 400 when stripe-signature header is missing", async () => {
      headersGet.mockReturnValue(null);
      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      expect(constructEvent).not.toHaveBeenCalled();
    });

    it("returns 400 when STRIPE_WEBHOOK_SECRET is missing", async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      expect(constructEvent).not.toHaveBeenCalled();
    });

    it("returns 400 when signature verification throws", async () => {
      constructEvent.mockImplementation(() => {
        throw new Error("bad signature");
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("bad signature");
    });
  });

  describe("non-handled events", () => {
    it("acknowledges events that aren't checkout.session.completed", async () => {
      constructEvent.mockReturnValue({
        type: "payment_intent.succeeded",
      } as unknown as Stripe.Event);
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      expect(sendTelegramMessage).not.toHaveBeenCalled();
    });
  });

  describe("coffee donations", () => {
    it("sends a telegram message and donation email", async () => {
      const session = checkoutSession();
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
      expect(sendDonationConfirmationEmail).toHaveBeenCalledWith({
        customerName: "Jane Buyer",
        customerEmail: "buyer@example.com",
        amount: 25,
      });
    });

    it("reports a failure telegram if the donation handler throws", async () => {
      sendDonationConfirmationEmail.mockRejectedValueOnce(
        new Error("smtp down"),
      );
      const session = checkoutSession();
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200); // we still ack to stripe
      const lastCall = sendTelegramMessage.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("Coffee Donation Processing Failed");
      expect(lastCall).toContain("smtp down");
    });
  });

  describe("other checkouts", () => {
    it("acknowledges them without notifying anyone", async () => {
      const session = checkoutSession({ metadata: { size: "M" } });
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(sendTelegramMessage).not.toHaveBeenCalled();
      expect(sendDonationConfirmationEmail).not.toHaveBeenCalled();
    });
  });
});
