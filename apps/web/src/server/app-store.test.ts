// @vitest-environment node
import { createPrivateKey, sign, X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny stand-in for the database: coffee_checkout keys and season totals.
const counted = new Map<string, number>();
let seasonCoffees = 0;
const revalidateTag = vi.fn();

vi.mock("~/server/db", () => ({
  db: {
    query: {
      global: {
        findFirst: async () => ({ currentSeason: { name: "2026-27" } }),
      },
    },
    transaction: async (run: (tx: unknown) => Promise<unknown>) =>
      run({
        insert: () => ({
          values: (row: { sessionId: string; coffees: number }) => ({
            onConflictDoNothing: () => ({
              returning: async () => {
                if (counted.has(row.sessionId)) return [];
                counted.set(row.sessionId, row.coffees);
                return [{ sessionId: row.sessionId }];
              },
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: async () => {
              seasonCoffees = [...counted.values()].reduce((a, b) => a + b, 0);
            },
          }),
        }),
      }),
  },
}));
vi.mock("~/server/services/stripe", () => ({ stripe: {} }));
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
  revalidateTag,
}));

const { recordAppStoreCoffee, verifyAppStoreTransaction } =
  await import("./app-store");

// A throwaway chain made with openssl, shaped like Apple's. Test keys only.
const fixtures = path.join(__dirname, "__fixtures__", "app-store");
const readFixture = (name: string) =>
  readFileSync(path.join(fixtures, name), "utf8");
const testRoot = readFixture("test-root-cert.pem");
const x5c = [
  "test-leaf-cert.pem",
  "test-intermediate-cert.pem",
  "test-root-cert.pem",
].map((name) => new X509Certificate(readFixture(name)).raw.toString("base64"));
const leafKey = createPrivateKey(readFixture("test-leaf-key.pem"));

function signTransaction(overrides: Record<string, unknown> = {}): string {
  const header = { alg: "ES256", x5c };
  const payload = {
    transactionId: "2000000123456789",
    originalTransactionId: "2000000123456789",
    bundleId: "com.wedgietracker.app",
    productId: "com.wedgietracker.app.coffee3",
    type: "Consumable",
    environment: "Production",
    quantity: 1,
    signedDate: Date.now(),
    purchaseDate: Date.now(),
    ...overrides,
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: leafKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${signature.toString("base64url")}`;
}

const record = (jws: string) => recordAppStoreCoffee(jws, testRoot);

beforeEach(() => {
  counted.clear();
  seasonCoffees = 0;
  revalidateTag.mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("verifyAppStoreTransaction", () => {
  it("reads a transaction signed through the trusted chain", () => {
    const transaction = verifyAppStoreTransaction(signTransaction(), testRoot);
    expect(transaction.productId).toBe("com.wedgietracker.app.coffee3");
  });

  it("rejects a chain that doesn't end at the Apple root", () => {
    expect(() => verifyAppStoreTransaction(signTransaction())).toThrow(
      "root isn't the trusted root",
    );
  });

  it("rejects a payload changed after signing", () => {
    const [header, , signature] = signTransaction().split(".");
    const forged = Buffer.from(
      JSON.stringify({
        transactionId: "1",
        bundleId: "com.wedgietracker.app",
        productId: "com.wedgietracker.app.coffee5",
        type: "Consumable",
        environment: "Production",
        quantity: 99,
      }),
    ).toString("base64url");
    expect(() =>
      verifyAppStoreTransaction(`${header}.${forged}.${signature}`, testRoot),
    ).toThrow("bad signature");
  });

  it("rejects anything that isn't a JWS", () => {
    expect(() => verifyAppStoreTransaction("nope", testRoot)).toThrow();
  });
});

describe("recordAppStoreCoffee", () => {
  it("counts a live purchase as the product's coffees times the quantity", async () => {
    expect(await record(signTransaction({ quantity: 2 }))).toEqual({
      status: "counted",
      coffees: 6,
    });
    expect(counted.get("appstore:2000000123456789")).toBe(6);
    expect(seasonCoffees).toBe(6);
    expect(revalidateTag).toHaveBeenCalledOnce();
  });

  it("thanks but never counts a Sandbox or Xcode purchase", async () => {
    for (const environment of ["Sandbox", "Xcode"]) {
      expect(await record(signTransaction({ environment }))).toEqual({
        status: "ignored",
        reason: "sandbox",
      });
    }
    expect(seasonCoffees).toBe(0);
  });

  it("rejects another app's purchase", async () => {
    expect(
      await record(signTransaction({ bundleId: "com.example.other" })),
    ).toEqual({ status: "rejected", reason: "wrong-app" });
  });

  it("rejects a product that isn't a coffee", async () => {
    expect(
      await record(
        signTransaction({ productId: "com.wedgietracker.app.coffee100" }),
      ),
    ).toEqual({ status: "rejected", reason: "unknown-product" });
    expect(await record(signTransaction({ type: "Non-Consumable" }))).toEqual({
      status: "rejected",
      reason: "unknown-product",
    });
  });

  it("rejects a refunded purchase", async () => {
    expect(
      await record(signTransaction({ revocationDate: Date.now() })),
    ).toEqual({ status: "rejected", reason: "revoked" });
    expect(seasonCoffees).toBe(0);
  });

  it("rejects a tampered or untrusted transaction without throwing", async () => {
    const [header, , signature] = signTransaction().split(".");
    const forged = Buffer.from("{}").toString("base64url");
    expect(await record(`${header}.${forged}.${signature}`)).toEqual({
      status: "rejected",
      reason: "invalid",
    });
    expect(await recordAppStoreCoffee(signTransaction())).toEqual({
      status: "rejected",
      reason: "invalid",
    });
    expect(seasonCoffees).toBe(0);
  });

  it("counts the same transaction only once", async () => {
    const jws = signTransaction();
    expect(await record(jws)).toEqual({ status: "counted", coffees: 3 });
    expect(await record(jws)).toEqual({ status: "counted", coffees: 3 });
    expect(seasonCoffees).toBe(3);
    expect(revalidateTag).toHaveBeenCalledOnce();
  });
});
