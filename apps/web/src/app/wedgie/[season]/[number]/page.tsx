import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildAllWedgiesQuery,
  seasonFromParam,
  seasonToParam,
  wedgiePath,
} from "@wedgietracker/core/utils/allWedgiesUrl";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";
import { getVideoSrc } from "@wedgietracker/core/utils/wedgieVideo";
import { PageLayout } from "~/components/layout/PageLayout";
import { WedgieWatch } from "~/components/wedgie/WedgieWatch";
import { APP_URL, generateMetadata as pageMetadata } from "~/config/metadata";
import { getWedgieForPage, getWedgiesForSitemap } from "~/server/wedgie-meta";

type Params = Promise<{ season: string; number: string }>;

/** Every wedgie at build time; one added later renders on its first visit. */
export async function generateStaticParams() {
  const wedgies = await getWedgiesForSitemap();
  return wedgies.map((w) => ({
    season: seasonToParam(w.seasonName),
    number: String(w.number),
  }));
}

async function load(params: Params) {
  const { season, number } = await params;
  const n = Number(number);
  if (!Number.isInteger(n) || n < 1) return null;
  return getWedgieForPage(seasonFromParam(season), n);
}

const teamName = (code: string) =>
  TEAMS.find((t) => t.code === code)?.fullName ?? code;

function youtubeId(url: string | undefined) {
  return url?.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
}

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}

type Found = NonNullable<Awaited<ReturnType<typeof getWedgieForPage>>>;

function describe(w: Found["wedgie"]) {
  const gems = isGemsDate(new Date(w.wedgieDate));
  // the date is the tip-off in US Eastern time written as if UTC
  const night = new Date(w.wedgieDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const types = w.types.map((t) => t.name.toLowerCase());
  const shot = types.length ? `${types.join(", ")} ` : "";
  const against = w.teamAgainstName.includes("Unknown")
    ? ""
    : ` against the ${teamName(w.teamAgainstName)}`;
  const when = gems ? "" : ` on ${night}`;
  const seasonPart =
    w.seasonName === "GEMS"
      ? ""
      : `, the ${ordinal(w.number)} of the ${w.seasonName} season`;
  return {
    title: `${w.playerName}, Wedgie No. ${w.number} of ${w.seasonName}`,
    description: `${w.playerName}'s ${shot}wedgie for the ${teamName(w.teamName)}${against}${when}${seasonPart}. Watch the clip on WedgieTracker.`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const found = await load(params);
  if (!found) return pageMetadata({ title: "Wedgie not found", noIndex: true });
  const w = found.wedgie;
  const id = youtubeId(w.videoUrl?.youtube);
  return pageMetadata({
    ...describe(w),
    image: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined,
    canonical: `${APP_URL}${wedgiePath(w.seasonName, w.number)}`,
  });
}

/** SQLite's CURRENT_TIMESTAMP ("2026-11-02 03:14:00") is UTC without saying so. */
function toIso(stamp: string) {
  const zoned = /[zZ]|[+-]\d{2}:\d{2}$/.test(stamp);
  return new Date(zoned ? stamp : `${stamp.replace(" ", "T")}Z`).toISOString();
}

/** schema.org VideoObject, so Google can list the clip as a video result. */
function videoJsonLd(w: Found["wedgie"]) {
  const v = w.videoUrl;
  // the clip the page opens on: the broadcast on YouTube, else the NoDunks one
  const source = v?.youtube
    ? "youtube"
    : v?.youtubeNoDunks
      ? "youtubeNoDunks"
      : null;
  if (!v || !source) return null;
  const embedUrl = getVideoSrc(source, v);
  const id = youtubeId(embedUrl);
  if (!embedUrl || !id) return null;

  const { title, description } = describe(w);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description,
    thumbnailUrl: [`https://img.youtube.com/vi/${id}/hqdefault.jpg`],
    // when the wedgie was added: the tip-off date has no time zone of its own
    uploadDate: toIso(w.createdAt),
    embedUrl,
    ...(v.hosted && { contentUrl: v.hosted }),
  };
}

const ARROW = { previous: "M15 19l-7-7 7-7", next: "M9 5l7 7-7 7" };

function NavLink({
  direction,
  href,
}: {
  direction: "previous" | "next";
  href: string | null;
}) {
  const label = direction === "previous" ? "Previous wedgie" : "Next wedgie";
  const className = `border-yellow bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple rounded-full border p-1 transition-all sm:p-2 ${
    href ? "" : "pointer-events-none opacity-50"
  }`;
  const icon = (
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={ARROW[direction]}
      />
    </svg>
  );
  return href ? (
    <Link href={href} aria-label={label} title={label} className={className}>
      {icon}
    </Link>
  ) : (
    <span aria-hidden="true" className={className}>
      {icon}
    </span>
  );
}

export default async function WedgiePage({ params }: { params: Params }) {
  const found = await load(params);
  if (!found) notFound();
  const { wedgie: w, previous, next } = found;
  const jsonLd = videoJsonLd(w);
  const gems = w.seasonName === "GEMS";

  return (
    <PageLayout>
      {jsonLd && (
        <script
          type="application/ld+json"
          // `<` escaped so a name can never close the script tag
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:py-8 lg:px-8">
        <div className="flex flex-col gap-2">
          <Link
            href={`/all-wedgies?${buildAllWedgiesQuery({ season: w.seasonName })}`}
            className="text-pink hover:text-yellow w-fit text-sm font-bold tracking-wider uppercase transition-colors"
          >
            ← All wedgies {gems ? GEMS_EMOJI : `of ${w.seasonName}`}
          </Link>
          {/* the card shows who and which; the heading stays for screen readers and search */}
          <h1 className="sr-only">
            {w.playerName}, Wedgie No. {w.number}
            {gems ? "" : ` of ${w.seasonName}`}
          </h1>
        </div>

        <WedgieWatch
          wedgie={w}
          nav={
            <div className="flex flex-row gap-1 sm:gap-3">
              <NavLink
                direction="previous"
                href={previous ? wedgiePath(w.seasonName, previous) : null}
              />
              <NavLink
                direction="next"
                href={next ? wedgiePath(w.seasonName, next) : null}
              />
            </div>
          }
        />
      </main>
    </PageLayout>
  );
}
