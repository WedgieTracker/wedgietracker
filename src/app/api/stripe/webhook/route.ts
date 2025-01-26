import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "~/server/db";
import { createPrintfulDraftOrder } from "~/server/services/printful";
import { sendTelegramMessage } from "~/server/services/telegram";
import { sendOrderConfirmationEmail } from "~/server/services/email";
import { sendDonationConfirmationEmail } from "~/server/services/email";
import type { Color } from "~/types/product";

// Disable Next.js body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

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

    // Check if this is a coffee donation by looking at the product name
    const isCoffeeDonation = session.metadata?.coffee === "true";

    if (isCoffeeDonation) {
      try {
        // Send notification for coffee donation
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
        // Create order in database with metadata and shipping details
        const order = await db.tshirtOrder.create({
          data: {
            stripeSessionId: session.id,
            customerEmail: session.customer_details?.email ?? "",
            size: session.metadata!.size ?? "",
            color: session.metadata!.color ?? "",
            shippingName: session.shipping_details?.name ?? "",
            shippingAddress: {
              line1: session.shipping_details?.address?.line1 ?? "",
              line2: session.shipping_details?.address?.line2 ?? "",
              city: session.shipping_details?.address?.city ?? "",
              state: session.shipping_details?.address?.state ?? "",
              postalCode: session.shipping_details?.address?.postal_code ?? "",
              country: session.shipping_details?.address?.country ?? "",
            },
          },
        });

        // Get current order number
        const { _count } = await db.tshirtOrder.aggregate({
          _count: {
            id: true,
          },
        });

        // Create Printful draft order
        try {
          const { result } = await createPrintfulDraftOrder({
            stripeSessionId: session.id,
            size: session.metadata!.size ?? "",
            color: session.metadata!.color ?? "",
            shippingName: session.shipping_details?.name ?? "",
            shippingAddress: {
              line1: session.shipping_details?.address?.line1 ?? "",
              line2: session.shipping_details?.address?.line2,
              city: session.shipping_details?.address?.city ?? "",
              state: session.shipping_details?.address?.state ?? "",
              postalCode: session.shipping_details?.address?.postal_code ?? "",
              country: session.shipping_details?.address?.country ?? "",
            },
            orderNumber: _count.id,
          });

          // Update database with Printful order ID
          await db.tshirtOrder.update({
            where: { id: order.id },
            data: { printfulOrderId: result.id.toString() },
          });

          // Get the folded image URL for the selected color
          const foldedImageUrl =
            TSHIRT_IMAGES[session.metadata!.color as Color]?.[0] ?? "";

          // Send success notification
          await Promise.all([
            sendTelegramMessage(
              `🎉 New T-shirt order received!\n\n` +
                `<b>Order Details:</b>\n` +
                `• Order #: ${_count.id}\n` +
                `• Size: ${session.metadata!.size}\n` +
                `• Color: ${session.metadata!.color}\n` +
                `• Customer: ${session.shipping_details?.name}\n` +
                `• Email: ${session.customer_details?.email}\n` +
                `• Amount: $${(session.amount_total ?? 0) / 100}\n\n` +
                `Printful draft order created successfully.`,
            ),
            sendOrderConfirmationEmail({
              orderNumber: _count.id,
              size: session.metadata!.size ?? "",
              color: session.metadata!.color ?? "",
              customerName: session.shipping_details?.name ?? "",
              customerEmail: session.customer_details?.email ?? "",
              shippingAddress: {
                line1: session.shipping_details?.address?.line1 ?? "",
                line2: session.shipping_details?.address?.line2 ?? "",
                city: session.shipping_details?.address?.city ?? "",
                state: session.shipping_details?.address?.state ?? "",
                postalCode:
                  session.shipping_details?.address?.postal_code ?? "",
                country: session.shipping_details?.address?.country ?? "",
              },
              amount: session.amount_total ?? 0,
              foldedImageUrl,
              stripeSessionId: session.id,
            }),
          ]);
        } catch (error) {
          console.error("Failed to create Printful order:", error);
          // Send failure notification
          await sendTelegramMessage(
            `⚠️ Printful Order Creation Failed!\n\n` +
              `<b>Order Details:</b>\n` +
              `• Order #: ${_count.id}\n` +
              `• Size: ${session.metadata!.size}\n` +
              `• Color: ${session.metadata!.color}\n` +
              `• Customer: ${session.shipping_details?.name}\n` +
              `• Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } catch (error) {
        console.error("Failed to process order:", error);
        // Send failure notification for database error
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
