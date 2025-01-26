import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

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
      const totalWedgies = await ctx.db.wedgie.count({
        where: {
          Season: {
            NOT: {
              name: "GEMS",
            },
          },
        },
      });

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
            "US", // USA - NBA
            "CA", // Canada - NBA, Toronto Raptors
            "GB", // UK
            "AU", // Australia - NBL
            "NZ", // New Zealand - NBL
            "IE", // Ireland
            "ZA", // South Africa
            "FR", // France - Pro A
            "DE", // Germany - BBL
            "IT", // Italy - Lega Basket
            "ES", // Spain - Liga ACB
            "PT", // Portugal
            "NL", // Netherlands - DBL
            "BE", // Belgium
            "DK", // Denmark
            "NO", // Norway
            "SE", // Sweden
            "CH", // Switzerland
            "AT", // Austria
            "PL", // Poland
            "CZ", // Czech Republic
            "SK", // Slovakia
            "HU", // Hungary
            "RO", // Romania
            "BG", // Bulgaria
            "HR", // Croatia
            "SI", // Slovenia - Strong basketball nation
            "BA", // Bosnia - Strong basketball tradition
            "RS", // Serbia - Major basketball country
            "GR", // Greece - Major basketball country
            "LT", // Lithuania - Strong basketball nation
            "LV", // Latvia - Growing basketball presence
            "EE", // Estonia
            "FI", // Finland
            "IL", // Israel - Strong domestic league
            "TR", // Turkey - BSL
            "PH", // Philippines - PBA
            "CN", // China - CBA
            "JP", // Japan - B.League
            "KR", // South Korea - KBL
            "AR", // Argentina - Strong basketball nation
            "BR", // Brazil - NBB
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
                minimum: {
                  unit: "business_day",
                  value: 7,
                },
                maximum: {
                  unit: "business_day",
                  value: 14,
                },
              },
            },
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/store`,
      });

      return session.id;
    }),

  getAvailableQuantity: publicProcedure.query(async ({ ctx }) => {
    // Get total wedgies (excluding GEMS)
    const totalWedgies = await ctx.db.wedgie.count({
      where: {
        Season: {
          NOT: {
            name: "GEMS",
          },
        },
      },
    });

    // Get current number of orders
    const currentOrders = await ctx.db.tshirtOrder.count();

    const inventory = totalWedgies - currentOrders;

    const currentNumber = currentOrders + 1;

    // Return the minimum between inventory and total wedgies
    return {
      totalWedgies,
      currentOrders,
      inventory,
      currentNumber,
    };
  }),
});
