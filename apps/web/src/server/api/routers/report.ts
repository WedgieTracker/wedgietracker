import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { wedgie, wedgieReport } from "@wedgietracker/core/schema";
import { WEDGIE_REPORT_FIELDS } from "@wedgietracker/core/types/report";
import { sendTelegramMessage } from "~/server/services/telegram";
import { APP_URL } from "~/config/metadata";

// Past this many unresolved reports on one wedgie, new ones are accepted but not stored or
// forwarded, so a single wedgie cannot be used to flood the table or the Telegram chat.
const MAX_OPEN_REPORTS_PER_WEDGIE = 10;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const reportField = z.enum(WEDGIE_REPORT_FIELDS);
const reportNote = z.string().trim().max(500).optional();
// Honeypot: hidden from people, filled in by bots.
const honeypot = z.string().optional();

const createInput = z.union([
  // One challenge covering several fields, each with its own note.
  z.object({
    wedgieId: z.number().int().positive(),
    items: z
      .array(z.object({ field: reportField, note: reportNote }))
      .min(1)
      .max(WEDGIE_REPORT_FIELDS.length)
      .refine(
        (items) => new Set(items.map((i) => i.field)).size === items.length,
        { message: "Each field can only be picked once" },
      ),
    website: honeypot,
  }),
  // The original single-field shape, still accepted from older clients.
  z.object({
    wedgieId: z.number().int().positive(),
    field: reportField,
    note: reportNote,
    website: honeypot,
  }),
]);

export const reportRouter = createTRPCRouter({
  create: publicProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      if (input.website) return { ok: true };

      const items = (
        "items" in input
          ? input.items
          : [{ field: input.field, note: input.note }]
      ).map((item) => ({
        field: item.field,
        note: item.note?.length ? item.note : null,
      }));

      const target = await ctx.db.query.wedgie.findFirst({
        where: eq(wedgie.id, input.wedgieId),
        columns: {
          id: true,
          number: true,
          seasonName: true,
          playerName: true,
          teamName: true,
          teamAgainstName: true,
        },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const [open] = await ctx.db
        .select({ count: count() })
        .from(wedgieReport)
        .where(
          and(
            eq(wedgieReport.wedgieId, target.id),
            eq(wedgieReport.resolved, false),
          ),
        );
      if ((open?.count ?? 0) >= MAX_OPEN_REPORTS_PER_WEDGIE) {
        return { ok: true };
      }

      // One row per field, written in a single insert so a challenge lands whole or not at all.
      const rows = items.map((item) => ({ wedgieId: target.id, ...item }));
      const insert = ctx.db.insert(wedgieReport);
      await (rows.length === 1 ? insert.values(rows[0]!) : insert.values(rows));

      const shareQuery = buildAllWedgiesQuery({
        season: target.seasonName,
        wedgie: target.number,
      });
      // With an assistant reading /api/reports, it tells the admin; Telegram is the fallback.
      if (!process.env.REPORTS_API_KEY)
        await sendTelegramMessage(
          [
            `🚩 <b>Wrong info reported</b> on wedgie #${target.number} (${escapeHtml(target.seasonName)})`,
            `${escapeHtml(target.playerName)}, ${escapeHtml(target.teamName)} vs ${escapeHtml(target.teamAgainstName)}`,
            ...(items.length === 1
              ? [
                  `Field: <b>${items[0]!.field}</b>`,
                  items[0]!.note ? `Note: ${escapeHtml(items[0]!.note)}` : null,
                ]
              : [
                  `Fields (${items.length}):`,
                  ...items.map(
                    (item) =>
                      `• <b>${item.field}</b>${item.note ? `: ${escapeHtml(item.note)}` : ""}`,
                  ),
                ]),
            "",
            `<a href="${APP_URL}/all-wedgies?${shareQuery}">View</a> · <a href="${APP_URL}/admin/wedgies/${target.id}">Edit</a> · <a href="${APP_URL}/admin/reports">Reports</a>`,
          ]
            .filter((line) => line !== null)
            .join("\n"),
        );

      return { ok: true };
    }),

  list: protectedProcedure
    .input(z.object({ resolved: z.boolean().default(false) }))
    .query(({ ctx, input }) =>
      ctx.db.query.wedgieReport.findMany({
        where: eq(wedgieReport.resolved, input.resolved),
        orderBy: desc(wedgieReport.createdAt),
        with: {
          wedgie: {
            columns: {
              id: true,
              number: true,
              seasonName: true,
              playerName: true,
              teamName: true,
              teamAgainstName: true,
            },
          },
        },
      }),
    ),

  setResolved: protectedProcedure
    .input(z.object({ id: z.number(), resolved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(wedgieReport)
        .set({ resolved: input.resolved })
        .where(eq(wedgieReport.id, input.id));
    }),
});
