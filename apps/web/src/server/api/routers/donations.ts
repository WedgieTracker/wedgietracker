import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { stripe } from "~/server/services/stripe";

export const donationsRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .mutation(async ({ input }) => {
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
        success_url: `${process.env.NEXTAUTH_URL}/support-us/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/support-us`,
      });

      return session.url;
    }),
});
