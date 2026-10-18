import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendTelegramMessage } from "~/server/services/telegram";
import { sendDonationConfirmationEmail } from "~/server/services/email";
import { stripe } from "~/server/services/stripe";

async function handleCoffeeDonation(session: Stripe.Checkout.Session) {
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
}

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
    const session = event.data.object;
    console.log("Session metadata", session.metadata);
    console.log("Session", session.success_url);

    // Coffee donations are the only checkout left since the store closed.
    if (session.metadata?.coffee === "true") {
      await handleCoffeeDonation(session);
    }
  }

  return NextResponse.json({ received: true });
}
