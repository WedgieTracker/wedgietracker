import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { stripe } from "~/server/services/stripe";
import { recordAppStoreCoffee } from "~/server/app-store";
import { getSeasonCoffees, recordCoffeeCheckout } from "~/server/coffees";
import {
  BOARD_NAME_MAX,
  STRIPE_NAME_FIELD,
  getCoffeeBoard,
  listBoardNames,
  sessionIdFromClaim,
  setBoardName,
  setBoardNameStatus,
} from "~/server/coffee-board";
import { addNewsletterSubscriber } from "~/server/services/email";
import { getCachedStats } from "./wedgie";

export const donationsRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .mutation(async ({ input }) => {
      // A preview deployment sends buyers back to itself, not to the live site.
      const siteUrl =
        process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXTAUTH_URL;
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "WedgieTracker - Coffee Donation ☕",
                description: "Thank you for your support!",
              },
              unit_amount: 100, // $1.00 in cents
            },
            quantity: input.quantity,
          },
        ],
        metadata: {
          coffee: "true",
        },
        mode: "payment",
        // Optional: a name for the coffee leaderboard, shown once approved.
        custom_fields: [
          {
            key: STRIPE_NAME_FIELD,
            label: {
              type: "custom",
              custom: "Name on the coffee leaderboard (optional)",
            },
            type: "text",
            optional: true,
            text: { maximum_length: BOARD_NAME_MAX },
          },
        ],
        // Stripe fills in the session id, so the thanks page can count the coffees.
        success_url: `${siteUrl}/support-us/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/support-us`,
      });

      return session.url;
    }),

  /** Counts a coffee bought in the iOS app, sent as its signed transaction. */
  recordAppStoreCoffee: publicProcedure
    .input(
      z.object({
        signedTransaction: z.string().max(20000),
        // Sent by newer apps only, so older ones keep working as before.
        boardName: z.string().max(200).nullish(),
        installId: z.string().uuid().nullish(),
      }),
    )
    .mutation(({ input }) =>
      recordAppStoreCoffee(input.signedTransaction, undefined, {
        name: input.boardName,
        installId: input.installId,
      }),
    ),

  /**
   * Saves the leaderboard name (and, if asked, the morning recap) for a
   * Stripe coffee: from the thanks page with its session id, or from a claim
   * link. Everything is checked against Stripe; the recap email is the one
   * on the purchase, never one sent from the page.
   */
  saveBoardName: publicProcedure
    .input(
      z.object({
        sessionId: z
          .string()
          .regex(/^cs_[A-Za-z0-9_]+$/)
          .optional(),
        claim: z.string().max(300).optional(),
        name: z.string().max(200),
        recap: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const sessionId = input.claim
        ? sessionIdFromClaim(input.claim)
        : input.sessionId;
      if (!sessionId) throw new TRPCError({ code: "BAD_REQUEST" });

      // Counts the coffee if it isn't yet, and proves it's a paid one.
      const coffees = await recordCoffeeCheckout(sessionId);
      if (!coffees) throw new TRPCError({ code: "NOT_FOUND" });
      await setBoardName(sessionId, input.name);

      let recap: "added" | "already" | "skipped" = "skipped";
      if (input.recap) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const email = session.customer_details?.email;
        if (email) {
          recap = (await addNewsletterSubscriber(email)) ? "added" : "already";
        }
      }
      return { recap };
    }),

  /** This season's coffee leaderboard. */
  getCoffeeBoard: publicProcedure.query(() => getCoffeeBoard()),

  /** Leaderboard names to approve, for the admin. */
  listBoardNames: protectedProcedure.query(() => listBoardNames()),

  /** Approves or rejects a leaderboard name. */
  setBoardNameStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().max(200),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(({ input }) => setBoardNameStatus(input.sessionId, input.status)),

  /** This season's coffees against its wedgies, for the app's scoreboard. */
  getSeasonCoffees: publicProcedure.query(async () => {
    const [{ season, coffees }, stats] = await Promise.all([
      getSeasonCoffees(),
      getCachedStats(),
    ]);
    return { season, coffees, wedgies: stats.currentSeasonWedgies };
  }),
});
