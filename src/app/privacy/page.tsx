import { Header } from "~/components/layout/Header";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for WedgieTracker - Learn how we handle and protect your data.",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto max-w-4xl px-4 py-8 text-white">
            <h1 className="mb-8 text-4xl font-bold text-yellow">
              Privacy Policy
            </h1>

            <div className="space-y-6">
              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Introduction
                </h2>
                <p>
                  This Privacy Policy explains how WedgieTracker
                  (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects,
                  uses, and protects your personal information when you use our
                  website (wedgietracker.com).
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Information We Collect
                </h2>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-yellow">
                    Personal Information
                  </h3>
                  <ul className="list-inside list-disc space-y-2">
                    <li>
                      Email address (when you subscribe to our newsletter)
                    </li>
                    <li>
                      Name and shipping address (when you make a purchase)
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold text-yellow">
                    Usage Data
                  </h3>
                  <p>
                    We use Google Analytics 4 (GA4) to collect standard internet
                    log information and details of visitor behavior patterns.
                    This includes:
                  </p>
                  <ul className="list-inside list-disc space-y-2">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on each page</li>
                    <li>Device information</li>
                    <li>Referral source</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  How We Use Your Information
                </h2>
                <ul className="list-inside list-disc space-y-2">
                  <li>To process and fulfill your orders</li>
                  <li>To send you our newsletter (if subscribed)</li>
                  <li>To improve our website and user experience</li>
                  <li>To analyze website traffic and usage patterns</li>
                  <li>To communicate with you about your orders</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Third-Party Services
                </h2>
                <p className="mb-4">
                  We use the following third-party services:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Google Analytics 4 for website analytics</li>
                  <li>Stripe for payment processing</li>
                  <li>Mailchimp for newsletter management</li>
                  <li>Printful for order fulfillment</li>
                  <li>Cloudinary for media storage</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Data Storage and Security
                </h2>
                <p>
                  We store your data securely using industry-standard practices.
                  Your payment information is never stored on our servers and is
                  handled directly by Stripe.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Your Rights
                </h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Unsubscribe from our newsletter</li>
                  <li>Opt-out of Google Analytics tracking</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Contact Us
                </h2>
                <p>
                  For any privacy-related questions or concerns, please contact
                  us at:{" "}
                  <a
                    href="mailto:yo@wedgietracker.com"
                    className="text-yellow underline"
                  >
                    yo@wedgietracker.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-pink">
                  Updates to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. The
                  latest version will always be posted on this page.
                </p>
                <p className="mt-2 text-sm">Last updated: 01/24/2025</p>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </MenuProvider>
  );
}
