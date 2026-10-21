import { Resend } from "resend";
import DonationConfirmationEmail from "./emails/DonationConfirmation";
import WelcomeEmail from "./emails/Welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

// The Resend segment the morning recap is broadcast to.
const NEWSLETTER_SEGMENT_ID = "01ce6b30-7569-4e99-8d78-8c77a9f43bf4";

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

/**
 * Adds an email to the newsletter. Returns false when it is already on it, so
 * the form can say so. Someone who unsubscribed and signs up again is put back.
 */
export async function addNewsletterSubscriber(email: string) {
  const existing = await resend.contacts.get({ email });
  if (existing.data) {
    const { data: segments } = await resend.contacts.segments.list({ email });
    const inNewsletter = segments?.data.some(
      (s) => s.id === NEWSLETTER_SEGMENT_ID,
    );
    if (inNewsletter && !existing.data.unsubscribed) return false;
    if (existing.data.unsubscribed) {
      await check(resend.contacts.update({ email, unsubscribed: false }));
    }
    if (!inNewsletter) {
      await check(
        resend.contacts.segments.add({
          email,
          segmentId: NEWSLETTER_SEGMENT_ID,
        }),
      );
    }
    return true;
  }
  await check(
    resend.contacts.create({
      email,
      segments: [{ id: NEWSLETTER_SEGMENT_ID }],
    }),
  );
  return true;
}

export async function sendWelcomeEmail(email: string) {
  await check(
    resend.emails.send({
      from: "WedgieTracker <noreply@noreply.wedgietracker.com>",
      to: [email],
      replyTo: "yo@wedgietracker.com",
      subject: "WedgieTracker - Thanks for subscribing!",
      react: WelcomeEmail(),
    }),
  );
}

// Resend reports failures in the response rather than throwing
async function check<T extends { error: { message: string } | null }>(
  call: Promise<T>,
) {
  const result = await call;
  if (result.error) throw new Error(result.error.message);
  return result;
}
