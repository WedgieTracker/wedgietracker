import { NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_marketing";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

// Add interface for the expected request body
interface SubscribeRequest {
  email: string;
}

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as SubscribeRequest;

    // Check if member exists
    try {
      await mailchimp.lists.getListMember(
        process.env.MAILCHIMP_LIST_ID!,
        email.toLowerCase(),
      );
      // If we get here, the member exists
      return NextResponse.json(
        { error: "You're already subscribed!" },
        { status: 400 },
      );
    } catch (error: unknown) {
      // Type guard for Mailchimp error
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        // Add new subscriber to Mailchimp
        await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID!, {
          email_address: email,
          status: "subscribed",
        });
        return NextResponse.json({ success: true });
      }
      throw error;
    }
  } catch (error: unknown) {
    console.error("Mailchimp error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
