import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addNewsletterSubscriber,
  sendWelcomeEmail,
} from "~/server/services/email";

const subscribeInput = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = subscribeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email" },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();

  try {
    if (!(await addNewsletterSubscriber(email))) {
      return NextResponse.json(
        { error: "You're already subscribed!" },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  // The subscription stands even if the thank-you email fails
  try {
    await sendWelcomeEmail(email);
  } catch (error: unknown) {
    console.error("Welcome email error:", error);
  }
  return NextResponse.json({ success: true });
}
