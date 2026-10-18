import { Resend } from "resend";
import DonationConfirmationEmail from "./emails/DonationConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

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
