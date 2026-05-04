import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// --- Mocks ----------------------------------------------------------------
// Every import in route.ts that reaches env validation, the network, or the
// DB has to be stubbed before the module loads.

const headersGet = vi.fn<(name: string) => string | null>();
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: headersGet }),
}));

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const constructEvent = vi.fn<() => Stripe.Event>();
vi.mock("~/server/services/stripe", () => ({
  stripe: { webhooks: { constructEvent } },
}));

// Drizzle chain: db.insert(...).values(...).returning() → [order]
//                db.select({...}).from(...)             → [{ count }]
//                db.update(...).set(...).where(...)     → void
const dbInsertReturning = vi.fn();
const dbSelectFrom = vi.fn();
const dbUpdateWhere = vi.fn();
vi.mock("~/server/db", () => ({
  db: {
    insert: () => ({
      values: () => ({ returning: dbInsertReturning }),
    }),
    select: () => ({ from: dbSelectFrom }),
    update: () => ({
      set: () => ({ where: dbUpdateWhere }),
    }),
  },
}));
vi.mock("~/server/schema", () => ({ tshirtOrder: { id: "id" } }));
vi.mock("~/server/cache", () => ({ CACHE_TAGS: { STORE_DATA: "store-data" } }));

const createPrintfulDraftOrder = vi.fn();
vi.mock("~/server/services/printful", () => ({ createPrintfulDraftOrder }));

const sendTelegramMessage = vi.fn();
vi.mock("~/server/services/telegram", () => ({ sendTelegramMessage }));

const sendOrderConfirmationEmail = vi.fn();
const sendDonationConfirmationEmail = vi.fn();
vi.mock("~/server/services/email", () => ({
  sendOrderConfirmationEmail,
  sendDonationConfirmationEmail,
}));

const { POST } = await import("./route");

// --- Fixtures -------------------------------------------------------------

function makeRequest(body = "raw-body") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
  });
}

function tshirtSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    amount_total: 2500,
    customer_details: { email: "buyer@example.com", name: "Jane Buyer" },
    collected_information: {
      shipping_details: {
        name: "Jane Buyer",
        address: {
          line1: "1 Main St",
          line2: "",
          city: "NYC",
          state: "NY",
          postal_code: "10001",
          country: "US",
        },
      },
    },
    metadata: { size: "M", color: "Black" },
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
    dbInsertReturning.mockResolvedValue([{ id: "order_1" }]);
    dbSelectFrom.mockResolvedValue([{ count: 42 }]);
    dbUpdateWhere.mockResolvedValue(undefined);
    createPrintfulDraftOrder.mockResolvedValue({ result: { id: 9001 } });
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
      expect(dbInsertReturning).not.toHaveBeenCalled();
    });
  });

  describe("coffee donations", () => {
    it("sends a telegram message and donation email", async () => {
      const session = tshirtSession({ metadata: { coffee: "true" } });
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
      expect(sendDonationConfirmationEmail).toHaveBeenCalledWith({
        customerName: "Jane Buyer",
        customerEmail: "buyer@example.com",
        amount: 25,
      });
      expect(dbInsertReturning).not.toHaveBeenCalled();
    });

    it("reports a failure telegram if the donation handler throws", async () => {
      sendDonationConfirmationEmail.mockRejectedValueOnce(
        new Error("smtp down"),
      );
      const session = tshirtSession({ metadata: { coffee: "true" } });
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200); // we still ack to stripe
      const lastCall = sendTelegramMessage.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("Coffee Donation Processing Failed");
      expect(lastCall).toContain("smtp down");
    });
  });

  describe("t-shirt orders", () => {
    it("inserts the order, creates a printful draft, and notifies", async () => {
      constructEvent.mockReturnValue(checkoutCompletedEvent(tshirtSession()));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(dbInsertReturning).toHaveBeenCalledOnce();
      expect(revalidateTag).toHaveBeenCalledWith("store-data", "max");
      expect(createPrintfulDraftOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeSessionId: "cs_test_123",
          size: "M",
          color: "Black",
          orderNumber: 42,
        }),
      );
      expect(dbUpdateWhere).toHaveBeenCalledOnce(); // printfulOrderId backfill
      expect(sendOrderConfirmationEmail).toHaveBeenCalledOnce();
      expect(sendTelegramMessage).toHaveBeenCalledOnce();
    });

    it("still records the order and alerts on Printful failure", async () => {
      createPrintfulDraftOrder.mockRejectedValueOnce(new Error("printful 500"));
      constructEvent.mockReturnValue(checkoutCompletedEvent(tshirtSession()));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(dbInsertReturning).toHaveBeenCalledOnce();
      expect(dbUpdateWhere).not.toHaveBeenCalled(); // no printful id to backfill
      expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
      const lastCall = sendTelegramMessage.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("Printful Order Creation Failed");
    });

    it("alerts on DB insert failure without crashing the webhook", async () => {
      dbInsertReturning.mockRejectedValueOnce(new Error("db down"));
      constructEvent.mockReturnValue(checkoutCompletedEvent(tshirtSession()));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(createPrintfulDraftOrder).not.toHaveBeenCalled();
      const lastCall = sendTelegramMessage.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("Order Processing Failed");
    });

    it("tolerates missing shipping/customer fields", async () => {
      const session = tshirtSession({
        customer_details: null,
        collected_information: null,
      } as unknown as Partial<Stripe.Checkout.Session>);
      constructEvent.mockReturnValue(checkoutCompletedEvent(session));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(dbInsertReturning).toHaveBeenCalledOnce();
    });
  });
});
