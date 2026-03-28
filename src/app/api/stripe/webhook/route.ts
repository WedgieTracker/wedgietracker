import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { count, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "~/server/db";
import { tshirtOrder } from "~/server/schema";
import { CACHE_TAGS } from "~/server/cache";
import { createPrintfulDraftOrder } from "~/server/services/printful";
import { sendTelegramMessage } from "~/server/services/telegram";
import { sendOrderConfirmationEmail } from "~/server/services/email";
import { sendDonationConfirmationEmail } from "~/server/services/email";
import { stripe } from "~/server/services/stripe";
import type { Color } from "~/types/product";

const TSHIRT_IMAGES: Record<Color, string[]> = {
  Black: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220662/mockups-tshirt/folded-black_xyfesd.png",
  ],
  "Ice Blue": [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220662/mockups-tshirt/folded-blue_eblukm.png",
  ],
  Peach: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220660/mockups-tshirt/folded-peach_llbbng.png",
  ],
  White: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737221067/mockups-tshirt/folded-white_nmxh0p.png",
  ],
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.log("Missing signature or webhook secret");
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.log("Webhook Error", { err });
    return NextResponse.json(
      {
        error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session: Stripe.Checkout.Session = event.data.object;

    console.log("Session metadata", event.data.object.metadata);
    console.log("Session", session.success_url);

    const isCoffeeDonation = session.metadata?.coffee === "true";

    if (isCoffeeDonation) {
      try {
        await sendTelegramMessage(
          `☕ New coffee donation received!\n\n` +
            `<b>Donation Details:</b>\n` +
            `• Amount: $${(session.amount_total ?? 0) / 100}\n` +
            `• From: ${session.customer_details?.email ?? "Anonymous"}\n`,
        );

        await sendDonationConfirmationEmail({
          customerName: session.customer_details?.name ?? "",
          customerEmail: session.customer_details?.email ?? "",
          amount: (session.amount_total ?? 0) / 100,
        });
      } catch (error) {
        console.error("Failed to process coffee donation:", error);
        await sendTelegramMessage(
          `❌ Coffee Donation Processing Failed!\n\n` +
            `<b>Session ID:</b> ${session.id}\n` +
            `<b>Error:</b> ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    } else {
      try {
        const [order] = await db
          .insert(tshirtOrder)
          .values({
            stripeSessionId: session.id,
            customerEmail: session.customer_details?.email ?? "",
            size: session.metadata!.size ?? "",
            color: session.metadata!.color ?? "",
            shippingName:
              session.collected_information?.shipping_details?.name ?? "",
            shippingAddress: {
              line1:
                session.collected_information?.shipping_details?.address
                  ?.line1 ?? "",
              line2:
                session.collected_information?.shipping_details?.address
                  ?.line2 ?? "",
              city:
                session.collected_information?.shipping_details?.address
                  ?.city ?? "",
              state:
                session.collected_information?.shipping_details?.address
                  ?.state ?? "",
              postalCode:
                session.collected_information?.shipping_details?.address
                  ?.postal_code ?? "",
              country:
                session.collected_information?.shipping_details?.address
                  ?.country ?? "",
            },
          })
          .returning();

        revalidateTag(CACHE_TAGS.STORE_DATA, "max");

        const [orderCountResult] = await db
          .select({ count: count() })
          .from(tshirtOrder);
        const orderCount = orderCountResult?.count ?? 0;

        try {
          const { result } = await createPrintfulDraftOrder({
            stripeSessionId: session.id,
            size: session.metadata!.size ?? "",
            color: session.metadata!.color ?? "",
            shippingName:
              session.collected_information?.shipping_details?.name ?? "",
            shippingAddress: {
              line1:
                session.collected_information?.shipping_details?.address
                  ?.line1 ?? "",
              line2:
                session.collected_information?.shipping_details?.address?.line2,
              city:
                session.collected_information?.shipping_details?.address
                  ?.city ?? "",
              state:
                session.collected_information?.shipping_details?.address
                  ?.state ?? "",
              postalCode:
                session.collected_information?.shipping_details?.address
                  ?.postal_code ?? "",
              country:
                session.collected_information?.shipping_details?.address
                  ?.country ?? "",
            },
            orderNumber: orderCount,
          });

          if (order) {
            await db
              .update(tshirtOrder)
              .set({ printfulOrderId: result.id.toString() })
              .where(eq(tshirtOrder.id, order.id));
          }

          const foldedImageUrl =
            TSHIRT_IMAGES[session.metadata!.color as Color]?.[0] ?? "";

          await Promise.all([
            sendTelegramMessage(
              `🎉 New T-shirt order received!\n\n` +
                `<b>Order Details:</b>\n` +
                `• Order #: ${orderCount}\n` +
                `• Size: ${session.metadata!.size}\n` +
                `• Color: ${session.metadata!.color}\n` +
                `• Customer: ${session.collected_information?.shipping_details?.name}\n` +
                `• Email: ${session.customer_details?.email}\n` +
                `• Amount: $${(session.amount_total ?? 0) / 100}\n\n` +
                `Printful draft order created successfully.`,
            ),
            sendOrderConfirmationEmail({
              orderNumber: orderCount,
              size: session.metadata!.size ?? "",
              color: session.metadata!.color ?? "",
              customerName:
                session.collected_information?.shipping_details?.name ?? "",
              customerEmail: session.customer_details?.email ?? "",
              shippingAddress: {
                line1:
                  session.collected_information?.shipping_details?.address
                    ?.line1 ?? "",
                line2:
                  session.collected_information?.shipping_details?.address
                    ?.line2 ?? "",
                city:
                  session.collected_information?.shipping_details?.address
                    ?.city ?? "",
                state:
                  session.collected_information?.shipping_details?.address
                    ?.state ?? "",
                postalCode:
                  session.collected_information?.shipping_details?.address
                    ?.postal_code ?? "",
                country:
                  session.collected_information?.shipping_details?.address
                    ?.country ?? "",
              },
              amount: session.amount_total ?? 0,
              foldedImageUrl,
              stripeSessionId: session.id,
            }),
          ]);
        } catch (error) {
          console.error("Failed to create Printful order:", error);
          await sendTelegramMessage(
            `⚠️ Printful Order Creation Failed!\n\n` +
              `<b>Order Details:</b>\n` +
              `• Order #: ${orderCount}\n` +
              `• Size: ${session.metadata!.size}\n` +
              `• Color: ${session.metadata!.color}\n` +
              `• Customer: ${session.collected_information?.shipping_details?.name}\n` +
              `• Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } catch (error) {
        console.error("Failed to process order:", error);
        await sendTelegramMessage(
          `❌ Order Processing Failed!\n\n` +
            `<b>Session ID:</b> ${session.id}\n` +
            `<b>Error:</b> ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
