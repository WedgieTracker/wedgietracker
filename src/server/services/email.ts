import { Resend } from "resend";
import OrderConfirmationEmail, {
  type OrderConfirmationEmailProps,
} from "./emails/OrderConfirmation";
import DonationConfirmationEmail from "./emails/DonationConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationEmailProps,
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
