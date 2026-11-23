// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Client } from "@libsql/client";
import type Stripe from "stripe";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// A real SQLite file, so the "only fill an empty name" guards run as on Turso.
const dbDir = mkdtempSync(path.join(tmpdir(), "wt-board-"));

vi.mock("~/server/db", async () => {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const schema = await import("@wedgietracker/core/schema");
  const client = createClient({ url: `file:${dbDir}/test.db` });
  return { client, db: drizzle(client, { schema }) };
});
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
  revalidateTag: () => undefined,
}));
vi.stubEnv("AUTH_SECRET", "test-secret");

const { client } = (await import("~/server/db")) as unknown as {
  client: Client;
};
const board = await import("./coffee-board");

const session = (fields: Partial<Stripe.Checkout.Session>) =>
  fields as Stripe.Checkout.Session;
const withName = (name: string, email = "Fan@Example.com") =>
  session({
    customer_details: { email } as Stripe.Checkout.Session.CustomerDetails,
    custom_fields: [
      { key: "board_name", text: { value: name } },
    ] as Stripe.Checkout.Session.CustomField[],
  });

async function row(key: string) {
  const { rows } = await client.execute({
    sql: "SELECT display_name, name_status, donor_key FROM coffee_checkout WHERE session_id = ?",
    args: [key],
  });
  return rows[0];
}

beforeAll(async () => {
  await client.execute(`CREATE TABLE coffee_checkout (
    session_id text PRIMARY KEY NOT NULL,
    season_name text NOT NULL,
    coffees integer NOT NULL,
    created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    refunded_at text,
    refund_changed_at integer,
    display_name text,
    name_status text,
    donor_key text
  )`);
});
beforeEach(async () => {
  await client.execute("DELETE FROM coffee_checkout");
  await client.execute(
    "INSERT INTO coffee_checkout (session_id, season_name, coffees) VALUES ('cs_live_a', '2026/27', 3)",
  );
});
afterAll(() => rmSync(dbDir, { recursive: true, force: true }));

describe("cleanBoardName", () => {
  it("trims, collapses spaces and caps at 24 characters", () => {
    expect(board.cleanBoardName("  Rim   Ruiner  ")).toBe("Rim Ruiner");
    expect(board.cleanBoardName("x".repeat(40))).toHaveLength(24);
  });
  it("treats empty, spaces and control characters as anonymous", () => {
    expect(board.cleanBoardName("")).toBeNull();
    expect(board.cleanBoardName("   \n\t ")).toBeNull();
    expect(board.cleanBoardName(null)).toBeNull();
  });
});

describe("claim tokens", () => {
  it("round-trips a checkout id", () => {
    const token = board.claimToken("cs_live_a");
    expect(board.sessionIdFromClaim(token)).toBe("cs_live_a");
  });
  it("refuses a tampered or foreign token", () => {
    const token = board.claimToken("cs_live_a");
    expect(
      board.sessionIdFromClaim(token.replace("cs_live_a", "cs_live_b")),
    ).toBeNull();
    expect(board.sessionIdFromClaim(`${token}x`)).toBeNull();
    expect(board.sessionIdFromClaim("cs_live_a.nope")).toBeNull();
  });
});

describe("donor keys", () => {
  it("are the same for one email in any case, and never the email", () => {
    const a = board.donorKeyForEmail("Fan@Example.com");
    expect(a).toBe(board.donorKeyForEmail(" fan@example.com "));
    expect(a).not.toContain("example");
    expect(board.donorKeyForInstall("id-1")).not.toBe(
      board.donorKeyForEmail("id-1"),
    );
  });
});

describe("names from Stripe and the thanks page", () => {
  it("takes Stripe's name as pending, with the donor key", async () => {
    await board.saveStripeBoardDetails(
      "cs_live_a",
      withName("Backboard Betty"),
    );
    expect(await row("cs_live_a")).toMatchObject({
      display_name: "Backboard Betty",
      name_status: "pending",
      donor_key: board.donorKeyForEmail("fan@example.com"),
    });
  });

  it("never lets a later Stripe visit overwrite the name from the form", async () => {
    await board.setBoardName("cs_live_a", "Glass Cleaner");
    await board.saveStripeBoardDetails(
      "cs_live_a",
      withName("Backboard Betty"),
    );
    expect((await row("cs_live_a"))?.display_name).toBe("Glass Cleaner");
  });

  it("lets the form replace Stripe's name", async () => {
    await board.saveStripeBoardDetails(
      "cs_live_a",
      withName("Backboard Betty"),
    );
    await board.setBoardName("cs_live_a", "Glass Cleaner");
    expect((await row("cs_live_a"))?.display_name).toBe("Glass Cleaner");
  });

  it("keeps an approved name approved when saved again, and re-checks a change", async () => {
    await board.setBoardName("cs_live_a", "Rim Ruiner");
    await board.setBoardNameStatus("cs_live_a", "approved");
    await board.setBoardName("cs_live_a", "Rim Ruiner");
    expect((await row("cs_live_a"))?.name_status).toBe("approved");
    await board.setBoardName("cs_live_a", "Rim Ruiner 2");
    expect((await row("cs_live_a"))?.name_status).toBe("pending");
  });

  it("goes back to anonymous when the name is cleared", async () => {
    await board.setBoardName("cs_live_a", "Rim Ruiner");
    await board.setBoardName("cs_live_a", "  ");
    expect(await row("cs_live_a")).toMatchObject({
      display_name: null,
      name_status: null,
    });
  });

  it("says when there's no such purchase", async () => {
    expect(await board.setBoardName("cs_live_missing", "Anyone")).toBe(false);
  });
});

describe("boardRows", () => {
  const r = (
    sessionId: string,
    coffees: number,
    extra: Partial<{
      donorKey: string;
      displayName: string;
      nameStatus: string;
      createdAt: string;
    }> = {},
  ) => ({
    sessionId,
    coffees,
    donorKey: extra.donorKey ?? null,
    displayName: extra.displayName ?? null,
    nameStatus: extra.nameStatus ?? null,
    createdAt: extra.createdAt ?? "2026-11-01 00:00:00",
  });

  it("groups one donor's coffees and shows only approved names", () => {
    expect(
      board.boardRows([
        r("a", 3, {
          donorKey: "e:1",
          displayName: "Betty",
          nameStatus: "approved",
        }),
        r("b", 2, { donorKey: "e:1" }),
        r("c", 4, { displayName: "Not Yet", nameStatus: "pending" }),
        r("d", 1, { displayName: "Nope", nameStatus: "rejected" }),
      ]),
    ).toEqual([
      { name: "Betty", coffees: 5 },
      { name: null, coffees: 4 },
      { name: null, coffees: 1 },
    ]);
  });

  it("uses a donor's newest approved name", () => {
    expect(
      board.boardRows([
        r("a", 1, {
          donorKey: "e:1",
          displayName: "Old",
          nameStatus: "approved",
          createdAt: "2026-10-01 00:00:00",
        }),
        r("b", 1, {
          donorKey: "e:1",
          displayName: "New",
          nameStatus: "approved",
          createdAt: "2026-11-01 00:00:00",
        }),
      ]),
    ).toEqual([{ name: "New", coffees: 2 }]);
  });
});
