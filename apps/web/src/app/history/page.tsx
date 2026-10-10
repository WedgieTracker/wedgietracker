import { Fragment } from "react";
import Link from "next/link";
import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { PageLayout } from "~/components/layout/PageLayout";
import { APP_STORE_URL } from "~/components/shared/AppStoreBadge";
import { generateMetadata } from "~/config/metadata";
import { TweetEmbed } from "./TweetEmbed";

export const metadata = generateMetadata({
  title: "The WedgieTracker story",
  description:
    "From a pandemic side project in London to an app: how WedgieTracker came to count every NBA wedgie.",
});

interface Milestone {
  date: string;
  title: string;
  body: React.ReactNode;
  link?: { href: string; label: string };
  /** A post to embed, with its video or photos. */
  tweet?: { id: string; label: string };
}

const linkClass =
  "text-yellow font-bold underline decoration-yellow/40 underline-offset-4 hover:decoration-yellow";

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {children}
    </a>
  );
}

/** Opens a wedgie, or a whole season, in the All Wedgies archive. */
function Archive({
  season,
  wedgie,
  children,
}: {
  season: string;
  wedgie?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/all-wedgies?${buildAllWedgiesQuery({ season, wedgie })}`}
      className={linkClass}
    >
      {children}
    </Link>
  );
}

/** The stretch of timeline from an entry down to the next one. */
function Segment({ className }: { className: string }) {
  return (
    <span
      className={`bg-yellow absolute top-0 -bottom-6 w-0.5 ${className}`}
      aria-hidden="true"
    />
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-black text-white">{children}</strong>;
}

const MILESTONES: { year: string; items: Milestone[] }[] = [
  {
    year: "2021",
    items: [
      {
        date: "1 Feb",
        title: "A website to track wedgies",
        body: (
          <>
            In the long pandemic days, scrolling Twitter after a day building
            websites for clients, I registered <B>wedgietracker.com</B> and
            emailed <Out href="https://x.com/NoDunksInc">No Dunks</Out>:{" "}
            <B>I made a website to track wedgies.</B>
          </>
        ),
      },
      {
        date: "14 Mar",
        title: "On Twitter",
        body: (
          <>
            <Out href="https://x.com/wedgietracker">@WedgieTracker</Out> joins
            Twitter, to post every wedgie as it happens.
          </>
        ),
      },
      {
        date: "22 Mar",
        title: "The first shout-outs",
        body: "The page took off, and the messages started coming in.",
        tweet: {
          id: "1373962105985101824",
          label: "WedgieTracker, March 2021",
        },
      },
      {
        date: "24 Mar",
        title: "A professor's paper",
        body: (
          <>
            <B>Richard</B>, a professor in the UK who had been counting wedgies
            for years, got in touch with his numbers and the{" "}
            <Out href="/wedgie-prevalence-2021.pdf">
              paper he wrote on how often wedgies happen
            </Out>
            .
          </>
        ),
      },
      {
        date: "7 Apr",
        title: "The first wedgie T-shirt",
        body: (
          <>
            The{" "}
            <Out href="https://breakingt.com/products/wedgie-counter">
              Wedgie Counter
            </Out>{" "}
            shirt with BreakingT and No Dunks <B>sold out in minutes</B>. One
            fan liked it enough to get the design <B>tattooed</B>.
          </>
        ),
        tweet: { id: "1522606995328708610", label: "No Dunks, May 2022" },
      },
      {
        date: "16 May",
        title: "A record in the short season",
        body: (
          <>
            In a season cut to <B>72 games</B> by COVID, De&apos;Andre
            Hunter&apos;s{" "}
            <Archive season="2020/21" wedgie={52}>
              No. 52
            </Archive>{" "}
            on the last night of the regular season beats the record of{" "}
            <Archive season="2016/17">51</Archive>, and the playoffs push it to{" "}
            <Archive season="2020/21">58</Archive>.
          </>
        ),
      },
    ],
  },
  {
    year: "2023",
    items: [
      {
        date: "14 Nov",
        title: "A wedgie in the Cup",
        body: (
          <>
            Paul George&apos;s last-second three sticks against the Nuggets,{" "}
            <Archive season="2023/24" wedgie={3}>
              the first wedgie
            </Archive>{" "}
            in <B>In-Season Tournament</B> history.
          </>
        ),
      },
      {
        date: "30 Dec",
        title: "On YouTube",
        body: (
          <>
            The{" "}
            <Out href="https://www.youtube.com/@wedgietracker">
              YouTube channel
            </Out>{" "}
            opens. Every wedgie back to 2014/15 is uploaded there.
          </>
        ),
      },
    ],
  },
  {
    year: "2024",
    items: [
      {
        date: "20 Apr",
        title: "A record in the playoffs",
        body: (
          <>
            After <Archive season="2022/23">2022/23</Archive> matched the 58,
            Jonathan Isaac&apos;s{" "}
            <Archive season="2023/24" wedgie={59}>
              No. 59
            </Archive>{" "}
            in Game 1 against the Cavs breaks it, and the season ends on{" "}
            <Archive season="2023/24">63</Archive>.
          </>
        ),
      },
      {
        date: "23 Nov",
        title: "On Bluesky and Instagram",
        body: (
          <>
            The first posts on{" "}
            <Out href="https://bsky.app/profile/wedgietracker.com/post/3lbm76zuzrs27">
              Bluesky
            </Out>
            , and a month later on{" "}
            <Out href="https://www.instagram.com/p/DD7Q6ZKCaEi/">Instagram</Out>
            .
          </>
        ),
      },
    ],
  },
  {
    year: "2025",
    items: [
      {
        date: "26 Jan",
        title: "Open source",
        body: (
          <>
            The code went <B>open source</B> for anyone to read or improve.
          </>
        ),
        link: {
          href: "https://github.com/wedgietracker/wedgietracker",
          label: "The code on GitHub",
        },
      },
    ],
  },
  {
    year: "2026",
    items: [
      {
        date: "16 Mar",
        title: "A record by mid-March",
        body: (
          <>
            Darius Garland&apos;s wedgie over Wemby is{" "}
            <Archive season="2025/26" wedgie={64}>
              No. 64
            </Archive>{" "}
            of the season, breaking the record of{" "}
            <Archive season="2023/24">63</Archive>.
          </>
        ),
      },
      {
        date: "8 Jun",
        title: "A record wedgie in the Finals",
        body: (
          <>
            Karl-Anthony Towns sticks the{" "}
            <Archive season="2025/26" wedgie={74}>
              first wedgie of the playoffs
            </Archive>
            , in the Finals, and the season ends on a record{" "}
            <Archive season="2025/26">74</Archive>.
          </>
        ),
      },
      {
        date: "21 Sep",
        title: "WedgieTracker on your phone",
        body: (
          <>
            The <Out href={APP_STORE_URL}>iOS app</Out> arrives on the App
            Store, with every wedgie, the standings and the stats. For the
            2026/27 season, the site and the app show <B>when in the game</B>{" "}
            each wedgie happened.
          </>
        ),
      },
    ],
  },
];

/** Written oldest first, shown newest first. */
const TIMELINE = MILESTONES.map(({ year, items }) => ({
  year,
  items: [...items].reverse(),
})).reverse();

export default function HistoryPage() {
  return (
    <PageLayout>
      <div className="flex w-full flex-col items-center gap-10 px-4 py-4 md:py-8 lg:px-8">
        <h1 className="text-center text-4xl leading-none font-black uppercase md:text-6xl">
          <span className="text-shadow-darkpurple text-yellow relative z-10 block leading-none">
            The
          </span>
          <span className="text-pink relative z-0 mt-[-.3em] block text-[1.2em] leading-none">
            Story
          </span>
        </h1>

        {/*
          One line through the years, each year a flag flying from it. Every
          entry draws the stretch of line down to the next one, so the line
          stops at the last dot.
        */}
        <ol className="ml-1 w-full max-w-2xl space-y-6 pl-8">
          {TIMELINE.map(({ year, items }, g) => (
            <Fragment key={year}>
              <li className="relative -ml-[25px] pt-4 first:pt-0">
                <Segment className="left-0" />
                <h2 className="bg-yellow text-darkpurple relative inline-block rounded-r-full py-0.5 pr-4 pl-3 text-2xl font-black md:text-3xl">
                  {year}
                </h2>
              </li>
              {items.map((m, i) => (
                <li key={m.title} className="relative">
                  {!(g === TIMELINE.length - 1 && i === items.length - 1) && (
                    <Segment className="-left-[25px]" />
                  )}
                  <span
                    className="bg-pink ring-darkpurple absolute top-0 -left-8 size-4 rounded-full ring-4"
                    aria-hidden="true"
                  />
                  <p className="text-pink text-xs font-black tracking-wider uppercase">
                    {m.date}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-white/80">{m.body}</p>
                  {m.link && (
                    <a
                      href={m.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow mt-2 inline-block text-sm font-bold underline-offset-4 hover:underline"
                    >
                      {m.link.label} ↗
                    </a>
                  )}
                  {m.tweet && (
                    <TweetEmbed id={m.tweet.id} label={m.tweet.label} />
                  )}
                </li>
              ))}
            </Fragment>
          ))}
        </ol>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/support-us"
            className="bg-yellow text-darkpurple rounded-xl px-6 py-3 font-black uppercase"
          >
            Keep me awake ☕
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
