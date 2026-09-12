import Link from "next/link";

import { PageLayout } from "~/components/layout/PageLayout";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Support",
  description:
    "Get help with WedgieTracker and the WedgieTracker iOS app, or report a wedgie we missed.",
});

const SUPPORT_EMAIL = "yo@wedgietracker.com";

export default function SupportPage() {
  return (
    <PageLayout showCircleMenu={false}>
      <div className="flex flex-1 flex-col">
        <div className="container mx-auto max-w-4xl px-4 py-8 text-white">
          <h1 className="text-yellow mb-8 text-4xl font-bold">Support</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Get in touch
              </h2>
              <p>
                Found a bug, spotted a wedgie we missed, or a clip that will not
                play? Email{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-yellow underline"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                and we will get back to you. For a wedgie or a clip, the date
                and the teams are enough for us to find it.
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">The iOS app</h2>
              <ul className="list-inside list-disc space-y-2">
                <li>Runs on iPhone with iOS 16.4 or later.</li>
                <li>
                  There is no account and nothing to sign in to. Every screen is
                  available as soon as you open it.
                </li>
                <li>
                  It needs an internet connection. If a screen cannot load,
                  check your connection and tap Retry.
                </li>
                <li>
                  During the NBA offseason the counter shows the final total of
                  the last season; the live count and pace return when the new
                  season starts.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">Privacy</h2>
              <p>
                What the website and the app collect, and what they do not, is
                in the{" "}
                <Link href="/privacy" className="text-yellow underline">
                  privacy policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-pink mb-4 text-2xl font-bold">
                Who runs WedgieTracker
              </h2>
              <p className="mb-4">
                WedgieTracker is an independent fan project. It is not
                affiliated with, endorsed by or sponsored by the NBA or its
                teams.
              </p>
              <p>
                The WedgieTracker iOS app is published by ZOKE.GG LTD, a company
                registered in England and Wales.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
