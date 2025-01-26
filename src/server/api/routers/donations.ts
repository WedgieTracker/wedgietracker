import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const donationsRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
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
        success_url: `${process.env.NEXTAUTH_URL}/store/success?session_id={CHECKOUT_SESSION_ID}&coffee=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/store`,
      });

      return session.id;
    }),
});
