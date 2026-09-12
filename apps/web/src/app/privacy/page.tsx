import { PageLayout } from "~/components/layout/PageLayout";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for WedgieTracker - Learn how we handle and protect your data.",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <PageLayout showCircleMenu={false}>
      <div className="flex flex-1 flex-col">
        <div className="container mx-auto max-w-4xl px-4 py-8 text-white">
          <h1 className="text-yellow mb-8 text-4xl font-bold">
            Privacy Policy
          </h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Introduction
              </h2>
              <p>
                This Privacy Policy explains how WedgieTracker (&quot;we&quot;,
                &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
                your personal information when you use our website
                (wedgietracker.com) and our iOS app. The two collect different
                things, and the app section below says exactly what the app
                does.
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                The WedgieTracker iOS App
              </h2>
              <p className="mb-4">
                There are no accounts, no newsletter and no store in the app, so
                none of the personal information described below is collected
                through it. We never learn your name or your email address, and
                there is nothing to sign in to.
              </p>
              <p className="mb-4">What leaves the phone:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong>Wedgie data</strong>, read from our own API when a
                  screen opens. Read-only, and it carries no identifier.
                </li>
                <li>
                  <strong>Video</strong>, played in YouTube&apos;s embedded
                  player. YouTube therefore sees this phone&apos;s address and
                  which clip was opened, sets its own cookies inside that
                  player, and its privacy policy governs all of it rather than
                  this one.
                </li>
                <li>
                  <strong>A crash or an error</strong>, to a crash reporter,
                  automatically when one happens. It carries what went wrong and
                  where in our own code, the app version, the iOS version and
                  the phone model. Every error is reduced to its type and code
                  first, so nothing personal can ride along inside one.
                </li>
                <li>
                  <strong>Which screens get opened</strong>, to an analytics
                  provider, automatically. Which part of the app was used and
                  which filters were picked. Never what you typed, and not your
                  location.
                </li>
              </ul>
              <p className="mt-4 mb-4">
                Both of those last two process your data in the European Union
                and neither stores your IP address. They are tied to a random
                identifier made on the device on first launch, not to you, and
                it is not derived from any hardware identifier. Neither is used
                to track you across other apps or websites, and neither is sold
                or shared with data brokers or advertisers.
              </p>
              <p className="mb-4">
                Crash reports are deleted automatically within 90 days. Usage
                analytics are kept for no more than 12 months and then deleted.
                Both providers act only on our instructions and are bound by
                data processing terms that protect your data at least as well as
                this policy does.
              </p>
              <p>
                Deleting the app stops all collection and removes the
                identifier. To have the data already collected from your phone
                deleted sooner, email us at the address below. Because none of
                it is linked to your name, tell us roughly when you used the app
                and we will remove what we can match.
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Information We Collect
              </h2>
              <div className="space-y-4">
                <h3 className="text-yellow text-xl font-semibold">
                  Personal Information
                </h3>
                <ul className="list-inside list-disc space-y-2">
                  <li>Email address (when you subscribe to our newsletter)</li>
                  <li>Name and shipping address (when you make a purchase)</li>
                </ul>

                <h3 className="text-yellow text-xl font-semibold">
                  Usage Data
                </h3>
                <p>
                  We use a web analytics provider to collect standard internet
                  log information and details of visitor behavior patterns. This
                  includes:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Anonymized IP address</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on each page</li>
                  <li>Device information</li>
                  <li>Referral source</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
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
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Third-Party Services
              </h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>A web analytics provider, for how the site is used</li>
                <li>A payment processor, for checkout</li>
                <li>A newsletter provider, for subscriptions</li>
                <li>An email provider, for order and donation confirmations</li>
                <li>A print and fulfilment partner, for orders</li>
                <li>A media host, for images and video</li>
              </ul>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Data Storage and Security
              </h2>
              <p>
                We store your data securely using industry-standard practices.
                Your payment information is never stored on our servers and is
                handled directly by our payment processor.
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Unsubscribe from our newsletter</li>
              </ul>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">Contact Us</h2>
              <p className="mb-4">
                The WedgieTracker iOS app is published by ZOKE.GG LTD,
                registered in England and Wales, company number 16383692,
                registered office 124-128 City Road, London EC1V 2NX.
              </p>
              <p>
                For any privacy-related questions or concerns, please contact us
                at:{" "}
                <a
                  href="mailto:yo@wedgietracker.com"
                  className="text-yellow underline"
                >
                  yo@wedgietracker.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Updates to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. The latest
                version will always be posted on this page.
              </p>
              <p className="mt-2 text-sm">Last updated: 09/12/2026</p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
