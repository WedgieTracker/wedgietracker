// @vitest-environment node
import { createPrivateKey, sign, X509Certificate } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Client } from "@libsql/client";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// A real SQLite file, so the refund guards run as they would on Turso.
const dbDir = mkdtempSync(path.join(tmpdir(), "wt-refunds-"));
const revalidateTag = vi.fn();

vi.mock("~/server/db", async () => {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const schema = await import("@wedgietracker/core/schema");
  const client = createClient({ url: `file:${dbDir}/test.db` });
  return { client, db: drizzle(client, { schema }) };
});
vi.mock("~/server/services/stripe", () => ({ stripe: {} }));
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
  revalidateTag,
}));

const { client } = (await import("~/server/db")) as unknown as {
  client: Client;
};
const { handleAppStoreNotification } =
  await import("./app-store-notifications");
const { recordAppStoreCoffee } = await import("./app-store");

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

function signJws(payload: unknown): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const signingInput = `${encode({ alg: "ES256", x5c })}.${encode(payload)}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: leafKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${signature.toString("base64url")}`;
}

function signTransaction(overrides: Record<string, unknown> = {}): string {
  return signJws({
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
  });
}

function signNotification(
  notificationType: string,
  data: Record<string, unknown> = {},
): string {
  return signJws({
    notificationType,
    notificationUUID: crypto.randomUUID(),
    version: "2.0",
    signedDate: Date.now(),
    data: {
      bundleId: "com.wedgietracker.app",
      environment: "Production",
      signedTransactionInfo: signTransaction({ revocationDate: Date.now() }),
      ...data,
    },
  });
}

const notify = (jws: string) => handleAppStoreNotification(jws, testRoot);
const key = "appstore:2000000123456789";

async function seasonCoffees(name: string): Promise<number> {
  const { rows } = await client.execute({
    sql: "SELECT coffees FROM season WHERE name = ?",
    args: [name],
  });
  return Number(rows[0]?.coffees);
}

async function refundedAt(sessionId: string): Promise<unknown> {
  const { rows } = await client.execute({
    sql: "SELECT refunded_at FROM coffee_checkout WHERE session_id = ?",
    args: [sessionId],
  });
  return rows[0]?.refunded_at;
}

/** Runs a migration file the way scripts/migrate.mjs does. */
async function migrate(name: string) {
  const sql = readFileSync(
    path.join(__dirname, "../../migrations", name),
    "utf8",
  );
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  await client.batch(statements, "write");
}

beforeAll(async () => {
  await client.batch(
    [
      `CREATE TABLE season (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL UNIQUE,
        created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        total_games integer DEFAULT 0 NOT NULL
      )`,
      `CREATE TABLE global (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        current_season_id integer DEFAULT 1 NOT NULL,
        current_total_wedgies integer DEFAULT 0 NOT NULL,
        current_total_games integer DEFAULT 0 NOT NULL,
        current_total_minutes integer DEFAULT 0 NOT NULL,
        current_total_fga integer DEFAULT 0 NOT NULL,
        current_total_poss integer DEFAULT 0 NOT NULL,
        pace integer DEFAULT 0 NOT NULL,
        simple_pace integer NOT NULL,
        math_pace integer NOT NULL,
        live_games integer DEFAULT false NOT NULL
      )`,
    ],
    "write",
  );
  await migrate("0001_season_coffees.sql");
  await migrate("0003_coffee_refunds.sql");
});

afterAll(() => {
  client.close();
  rmSync(dbDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await client.batch(
    [
      "DELETE FROM coffee_checkout",
      "DELETE FROM season",
      "DELETE FROM global",
      "INSERT INTO season (id, name, coffees) VALUES (1, '2025-26', 40), (2, '2026-27', 10)",
      "INSERT INTO global (id, current_season_id, simple_pace, math_pace) VALUES (1, 2, 0, 0)",
    ],
    "write",
  );
  revalidateTag.mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("handleAppStoreNotification", () => {
  it("takes a refunded coffee off the season once and keeps its row", async () => {
    expect(await recordAppStoreCoffee(signTransaction(), testRoot)).toEqual({
      status: "counted",
      coffees: 3,
    });
    expect(await seasonCoffees("2026-27")).toBe(13);
    revalidateTag.mockClear();

    expect(await notify(signNotification("REFUND"))).toEqual({
      status: "refunded",
      coffees: 3,
    });
    expect(await seasonCoffees("2026-27")).toBe(10);
    expect(await refundedAt(key)).toEqual(expect.any(String));
    expect(revalidateTag).toHaveBeenCalledOnce();

    // Apple sending the refund again, or the app resending the purchase,
    // changes nothing.
    expect(await notify(signNotification("REFUND"))).toEqual({
      status: "ignored",
      reason: "already-done",
    });
    await recordAppStoreCoffee(signTransaction(), testRoot);
    expect(await seasonCoffees("2026-27")).toBe(10);
    expect(revalidateTag).toHaveBeenCalledOnce();
  });

  it("treats REVOKE as a refund", async () => {
    await recordAppStoreCoffee(signTransaction(), testRoot);
    expect(await notify(signNotification("REVOKE"))).toEqual({
      status: "refunded",
      coffees: 3,
    });
    expect(await seasonCoffees("2026-27")).toBe(10);
  });

  it("takes coffees off the season they were added to, never below 0", async () => {
    await client.execute(
      "INSERT INTO coffee_checkout (session_id, season_name, coffees) VALUES ('appstore:2000000123456789', '2025-26', 50)",
    );
    expect(await notify(signNotification("REFUND"))).toEqual({
      status: "refunded",
      coffees: 50,
    });
    expect(await seasonCoffees("2025-26")).toBe(0);
    expect(await seasonCoffees("2026-27")).toBe(10);
  });

  it("adds the coffees back once when a refund is reversed", async () => {
    await recordAppStoreCoffee(signTransaction(), testRoot);
    await notify(signNotification("REFUND"));
    expect(await seasonCoffees("2026-27")).toBe(10);

    const reversal = signNotification("REFUND_REVERSED", {
      signedTransactionInfo: signTransaction(),
    });
    expect(await notify(reversal)).toEqual({ status: "restored", coffees: 3 });
    expect(await seasonCoffees("2026-27")).toBe(13);
    expect(await refundedAt(key)).toBeNull();

    expect(await notify(reversal)).toEqual({
      status: "ignored",
      reason: "already-done",
    });
    expect(await seasonCoffees("2026-27")).toBe(13);
  });

  it("does nothing to a coffee that was never refunded when a reversal comes", async () => {
    await recordAppStoreCoffee(signTransaction(), testRoot);
    expect(await notify(signNotification("REFUND_REVERSED"))).toEqual({
      status: "ignored",
      reason: "already-done",
    });
    expect(await seasonCoffees("2026-27")).toBe(13);
  });

  it("logs and ignores a refund for a purchase never counted", async () => {
    expect(await notify(signNotification("REFUND"))).toEqual({
      status: "ignored",
      reason: "unknown-purchase",
    });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("never counted"),
    );
    expect(await seasonCoffees("2026-27")).toBe(10);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("ignores Sandbox and Xcode notifications", async () => {
    await recordAppStoreCoffee(signTransaction(), testRoot);
    for (const environment of ["Sandbox", "Xcode"]) {
      expect(await notify(signNotification("REFUND", { environment }))).toEqual(
        { status: "ignored", reason: "sandbox" },
      );
    }
    // A Production envelope around a Sandbox transaction counts for nothing too.
    expect(
      await notify(
        signNotification("REFUND", {
          signedTransactionInfo: signTransaction({ environment: "Sandbox" }),
        }),
      ),
    ).toEqual({ status: "ignored", reason: "sandbox" });
    expect(await seasonCoffees("2026-27")).toBe(13);
  });

  it("acknowledges TEST and other types without changing anything", async () => {
    const test = signJws({
      notificationType: "TEST",
      notificationUUID: crypto.randomUUID(),
      signedDate: Date.now(),
      data: { bundleId: "com.wedgietracker.app", environment: "Production" },
    });
    expect(await notify(test)).toEqual({
      status: "ignored",
      reason: "not-handled",
    });
    expect(await notify(signNotification("CONSUMPTION_REQUEST"))).toEqual({
      status: "ignored",
      reason: "not-handled",
    });
    expect(await seasonCoffees("2026-27")).toBe(10);
  });

  it("ignores a refund for a product that isn't a coffee", async () => {
    expect(
      await notify(
        signNotification("REFUND", {
          signedTransactionInfo: signTransaction({
            productId: "com.wedgietracker.app.other",
          }),
        }),
      ),
    ).toEqual({ status: "ignored", reason: "not-a-coffee" });
  });

  it("rejects payloads that don't verify, or aren't for this app", async () => {
    await recordAppStoreCoffee(signTransaction(), testRoot);
    const [header, , signature] = signNotification("REFUND").split(".");
    const forged = Buffer.from(
      JSON.stringify({ notificationType: "REFUND", data: {} }),
    ).toString("base64url");
    const rejected = { status: "rejected", reason: "invalid" };

    expect(await notify(`${header}.${forged}.${signature}`)).toEqual(rejected);
    expect(await notify("not-a-jws")).toEqual(rejected);
    // Signed by our test chain but checked against the real Apple root.
    expect(
      await handleAppStoreNotification(signNotification("REFUND")),
    ).toEqual(rejected);
    // A verified envelope around a transaction that doesn't verify.
    const [txHeader, , txSignature] = signTransaction().split(".");
    const txForged = Buffer.from(
      JSON.stringify({ transactionId: "1" }),
    ).toString("base64url");
    expect(
      await notify(
        signNotification("REFUND", {
          signedTransactionInfo: `${txHeader}.${txForged}.${txSignature}`,
        }),
      ),
    ).toEqual(rejected);
    // Signed, but not shaped like a notification.
    expect(await notify(signJws({ hello: "world" }))).toEqual(rejected);

    expect(
      await notify(
        signNotification("REFUND", { bundleId: "com.example.other" }),
      ),
    ).toEqual({ status: "rejected", reason: "wrong-app" });
    expect(
      await notify(
        signNotification("REFUND", {
          signedTransactionInfo: signTransaction({
            bundleId: "com.example.other",
          }),
        }),
      ),
    ).toEqual({ status: "rejected", reason: "wrong-app" });

    expect(await seasonCoffees("2026-27")).toBe(13);
    expect(await refundedAt(key)).toBeNull();
  });
});
