import { z } from "zod";
import { count, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { createTRPCRouter, publicProcedure } from "../trpc";
import Stripe from "stripe";
import { db } from "~/server/db";
import { wedgie, tshirtOrder } from "~/server/schema";
import { CACHE_TAGS } from "~/server/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const getCachedAvailableQuantity = unstable_cache(
  async () => {
    const [wedgieCount] = await db
      .select({ count: count() })
      .from(wedgie)
      .where(ne(wedgie.seasonName, "GEMS"));

    const [orderCount] = await db.select({ count: count() }).from(tshirtOrder);

    const totalWedgies = wedgieCount?.count ?? 0;
    const currentOrders = orderCount?.count ?? 0;
    const inventory = totalWedgies - currentOrders;
    const currentNumber = currentOrders + 1;
    return { totalWedgies, currentOrders, inventory, currentNumber };
  },
  ["store-getAvailableQuantity"],
  { tags: [CACHE_TAGS.STORE_DATA], revalidate: 60 },
);

export const storeRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
        color: z.enum(["Black", "White", "Ice Blue", "Peach"]),
        price: z.number(),
        currentNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [wedgieCount] = await ctx.db
        .select({ count: count() })
        .from(wedgie)
        .where(ne(wedgie.seasonName, "GEMS"));

      const totalWedgies = wedgieCount?.count ?? 0;

      if (totalWedgies <= 0) {
        throw new Error("No t-shirts available");
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        metadata: {
          size: input.size,
          color: input.color,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Wedgie T-Shirt",
                description: `Size: ${input.size}, Color: ${input.color}`,
              },
              unit_amount: input.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        shipping_address_collection: {
          allowed_countries: [
            "US",
            "CA",
            "GB",
            "AU",
            "NZ",
            "IE",
            "ZA",
            "FR",
            "DE",
            "IT",
            "ES",
            "PT",
            "NL",
            "BE",
            "DK",
            "NO",
            "SE",
            "CH",
            "AT",
            "PL",
            "CZ",
            "SK",
            "HU",
            "RO",
            "BG",
            "HR",
            "SI",
            "BA",
            "RS",
            "GR",
            "LT",
            "LV",
            "EE",
            "FI",
            "IL",
            "TR",
            "PH",
            "CN",
            "JP",
            "KR",
            "AR",
            "BR",
          ],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 0,
                currency: "usd",
              },
              display_name: "Free Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 21 },
                maximum: { unit: "business_day", value: 28 },
              },
            },
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/store`,
      });

      return session.id;
    }),

  getAvailableQuantity: publicProcedure.query(() =>
    getCachedAvailableQuantity(),
  ),
});
