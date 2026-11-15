import { PageLayout } from "~/components/layout/PageLayout";
import {
  DocSection,
  docLink,
  docList,
  docSubheading,
} from "~/components/shared/DocSection";
import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { PageHeading } from "~/components/shared/PageHeading";
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-[18px] py-8 md:py-12">
        <PageHeading title="Privacy policy" />

        <div className="mt-2 flex flex-col gap-4">
          <DocSection title="Introduction">
            <p>
              This Privacy Policy explains how WedgieTracker (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
              your personal information when you use our website
              (wedgietracker.com) and our iOS app. The two collect different
              things, and the app section below says exactly what the app does.
            </p>
          </DocSection>

          <DocSection title="The WedgieTracker iOS app">
            <p>
              There are no accounts, no newsletter and no store in the app, so
              none of the personal information described below is collected
              through it. We never learn your name or your email address, and
              there is nothing to sign in to.
            </p>
            <p>What leaves the phone:</p>
            <ul className={docList}>
              <li>
                <strong>Wedgie data</strong>, read from our own API when a
                screen opens. Read-only, and it carries no identifier.
              </li>
              <li>
                <strong>Video</strong>, played in YouTube&apos;s embedded
                player. YouTube therefore sees this phone&apos;s address and
                which clip was opened, sets its own cookies inside that player,
                and its privacy policy governs all of it rather than this one.
              </li>
              <li>
                <strong>A crash or an error</strong>, to a crash reporter,
                automatically when one happens. It carries what went wrong and
                where in our own code, the app version, the iOS version and the
                phone model. Every error is reduced to its type and code first,
                so nothing personal can ride along inside one.
              </li>
              <li>
                <strong>Which screens get opened</strong>, to an analytics
                provider, automatically. Which part of the app was used and
                which filters were picked. Never what you typed, and not your
                location.
              </li>
            </ul>
            <p>
              Both of those last two process your data in the European Union and
              neither stores your IP address. They are tied to a random
              identifier made on the device on first launch, not to you, and it
              is not derived from any hardware identifier. Neither is used to
              track you across other apps or websites, and neither is sold or
              shared with data brokers or advertisers.
            </p>
            <p>
              Crash reports are deleted automatically within 90 days. Usage
              analytics are kept for no more than 12 months and then deleted.
              Both providers act only on our instructions and are bound by data
              processing terms that protect your data at least as well as this
              policy does.
            </p>
            <p>
              Deleting the app stops all collection and removes the identifier.
              To have the data already collected from your phone deleted sooner,
              email us at the address below. Because none of it is linked to
              your name, tell us roughly when you used the app and we will
              remove what we can match.
            </p>
          </DocSection>

          <DocSection title="Information we collect">
            <div className="space-y-3">
              <h3 className={docSubheading}>Personal information</h3>
              <ul className={docList}>
                <li>Email address (when you subscribe to our newsletter)</li>
                <li>Name and email address (when you buy us a coffee)</li>
              </ul>

              <h3 className={docSubheading}>Usage data</h3>
              <p>
                We use a web analytics provider to collect standard internet log
                information and details of visitor behavior patterns. This
                includes:
              </p>
              <ul className={docList}>
                <li>Anonymized IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on each page</li>
                <li>Device information</li>
                <li>Referral source</li>
              </ul>
            </div>
          </DocSection>

          <DocSection title="How we use your information">
            <ul className={docList}>
              <li>To process your coffee donation and send a receipt</li>
              <li>To send you our newsletter (if subscribed)</li>
              <li>To improve our website and user experience</li>
              <li>To analyze website traffic and usage patterns</li>
            </ul>
          </DocSection>

          <DocSection title="Third-party services">
            <p>We use the following third-party services:</p>
            <ul className={docList}>
              <li>A web analytics provider, for how the site is used</li>
              <li>A payment processor, for coffee donations</li>
              <li>A newsletter provider, for subscriptions</li>
              <li>An email provider, for donation confirmations</li>
              <li>A media host, for images and video</li>
            </ul>
          </DocSection>

          <DocSection title="Data storage and security">
            <p>
              We store your data securely using industry-standard practices.
              Your payment information is never stored on our servers and is
              handled directly by our payment processor.
            </p>
          </DocSection>

          <DocSection title="Your rights">
            <p>You have the right to:</p>
            <ul className={docList}>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Unsubscribe from our newsletter</li>
            </ul>
          </DocSection>

          <DocSection title="Contact us">
            <p>
              The WedgieTracker iOS app is published by ZOKE.GG LTD, registered
              in England and Wales.
            </p>
            <p>
              For any privacy-related questions or concerns, please contact us
              at:{" "}
              <a href="mailto:yo@wedgietracker.com" className={docLink}>
                yo@wedgietracker.com
              </a>
            </p>
          </DocSection>

          <DocSection title="Updates to this policy">
            <p>
              We may update this Privacy Policy from time to time. The latest
              version will always be posted on this page.
            </p>
            <p className="text-cream/50 text-[13px]">
              Last updated: 10/18/2026
            </p>
          </DocSection>
        </div>

        <ExploreFooter
          className="max-w-2xl"
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Standings", url: "/standings" },
            { title: "Support", url: "/support" },
          ]}
        />
      </div>
    </PageLayout>
  );
}
