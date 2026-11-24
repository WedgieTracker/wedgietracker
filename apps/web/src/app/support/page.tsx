import Link from "~/components/shared/HoverLink";

import { PageLayout } from "~/components/layout/PageLayout";
import { AppStoreBadge } from "~/components/shared/AppStoreBadge";
import { DocSection, docLink, docList } from "~/components/shared/DocSection";
import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { PageHeading } from "~/components/shared/PageHeading";
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-[18px] py-8 md:py-12">
        <PageHeading title="Support" />

        <div className="mt-2 flex flex-col gap-4">
          <DocSection title="Get in touch">
            <p>
              Found a bug, spotted a wedgie we missed, or a clip that will not
              play? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={docLink}>
                {SUPPORT_EMAIL}
              </a>{" "}
              and we will get back to you. For a wedgie or a clip, the date and
              the teams are enough for us to find it.
            </p>
          </DocSection>

          <DocSection title="The iOS app">
            <AppStoreBadge />
            <ul className={docList}>
              <li>Runs on iPhone with iOS 16.4 or later.</li>
              <li>
                There is no account and nothing to sign in to. Every screen is
                available as soon as you open it.
              </li>
              <li>
                It needs an internet connection. If a screen cannot load, check
                your connection and tap Retry.
              </li>
              <li>
                During the NBA offseason the counter shows the final total of
                the last season; the live count and pace return when the new
                season starts.
              </li>
            </ul>
          </DocSection>

          <DocSection title="Privacy">
            <p>
              What the website and the app collect, and what they do not, is in
              the{" "}
              <Link href="/privacy" className={docLink}>
                privacy policy
              </Link>
              .
            </p>
          </DocSection>

          <DocSection title="Who runs WedgieTracker">
            <p>
              WedgieTracker is an independent fan project. It is not affiliated
              with, endorsed by or sponsored by the NBA or its teams.
            </p>
            <p>
              The WedgieTracker iOS app is published by ZOKE.GG LTD, a company
              registered in England and Wales.
            </p>
          </DocSection>
        </div>

        <ExploreFooter
          className="max-w-2xl"
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Standings", url: "/standings" },
            { title: "Stats for nerds", url: "/stats-for-nerds" },
          ]}
        />
      </div>
    </PageLayout>
  );
}
