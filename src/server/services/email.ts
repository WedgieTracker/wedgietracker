import { Resend } from "resend";
import OrderConfirmationEmail from "./emails/OrderConfirmation";
import DonationConfirmationEmail from "./emails/DonationConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOrderConfirmationEmailParams {
  orderNumber: number;
  size: string;
  color: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  amount: number;
  foldedImageUrl: string;
  stripeSessionId: string;
}

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationEmailParams,
) {
  try {
    await resend.emails.send({
      from: "WedgieTracker <noreply@noreply.wedgietracker.com>",
      to: [params.customerEmail],
      replyTo: "yo@wedgietracker.com",
      bcc: ["riccardoaltieri@me.com"],
      subject: `Order Confirmation #${params.orderNumber.toString().padStart(3, "0")} - OG Wedgie T-Shirt`,
      react: OrderConfirmationEmail(params),
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
}

interface SendDonationConfirmationEmailParams {
  customerName: string;
  customerEmail: string;
  amount: number;
}

export async function sendDonationConfirmationEmail(
  params: SendDonationConfirmationEmailParams,
) {
  await resend.emails.send({
    from: "WedgieTracker <noreply@noreply.wedgietracker.com>",
    to: [params.customerEmail],
    subject: "WedgieTracker - ☕ Coffee Donation Confirmation",
    react: DonationConfirmationEmail(params),
  });
}
