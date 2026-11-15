import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { stripe } from "~/server/services/stripe";
import { recordAppStoreCoffee } from "~/server/app-store";
import { getSeasonCoffees } from "~/server/coffees";
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
        // Stripe fills in the session id, so the thanks page can count the coffees.
        success_url: `${siteUrl}/support-us/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/support-us`,
      });

      return session.url;
    }),

  /** Counts a coffee bought in the iOS app, sent as its signed transaction. */
  recordAppStoreCoffee: publicProcedure
    .input(z.object({ signedTransaction: z.string().max(20000) }))
    .mutation(({ input }) => recordAppStoreCoffee(input.signedTransaction)),

  /** This season's coffees against its wedgies, for the app's scoreboard. */
  getSeasonCoffees: publicProcedure.query(async () => {
    const [{ season, coffees }, stats] = await Promise.all([
      getSeasonCoffees(),
      getCachedStats(),
    ]);
    return { season, coffees, wedgies: stats.currentSeasonWedgies };
  }),
});
