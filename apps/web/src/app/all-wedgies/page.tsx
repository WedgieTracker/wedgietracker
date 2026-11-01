import type { Metadata } from "next";
import { connection } from "next/server";
import {
  buildAllWedgiesQuery,
  seasonFromParam,
} from "@wedgietracker/core/utils/allWedgiesUrl";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";
import { AllWedgiesPage } from "~/components/all-wedgies/AllWedgiesPage";
import { PageLayout } from "~/components/layout/PageLayout";
import { Suspense } from "react";
import { Loader } from "~/components/shared/Loader";
import { APP_URL, generateMetadata as pageMetadata } from "~/config/metadata";
import { getWedgieForMeta } from "~/server/wedgie-meta";

const ALL_WEDGIES = pageMetadata({
  title: "All Wedgies",
  description:
    "All wedgies, how many times a basketball gets stuck between the backboard and the rim.",
  canonical: `${APP_URL}/all-wedgies`,
});

const teamName = (code: string) =>
  TEAMS.find((t) => t.code === code)?.fullName ?? code;

function youtubeThumbnail(url: string | undefined) {
  const id = url?.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}

/**
 * A link to one wedgie (?season=2026-27&wedgie=5, or the older ws/wn) gets its own title,
 * description and canonical address, so each can be listed in the sitemap without reading
 * as a copy of All Wedgies. Everything else, filters included, points at /all-wedgies.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const season = one("season") ?? one("ws");
  const number = Number(one("wedgie") ?? one("wn"));
  if (!season || season === "all" || !Number.isInteger(number) || number < 1) {
    return ALL_WEDGIES;
  }

  const w = await getWedgieForMeta(seasonFromParam(season), number);
  if (!w) return ALL_WEDGIES;

  // the date is the tip-off in US Eastern time written as if UTC
  const night = new Date(w.wedgieDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const types = w.wedgieToTypes.map((t) => t.type.name.toLowerCase());
  const shot = types.length ? `${types.join(", ")} ` : "";
  return pageMetadata({
    title: `${w.playerName}, Wedgie No. ${w.number} of ${w.seasonName}`,
    description: `${w.playerName}'s ${shot}wedgie for the ${teamName(w.teamName)} against the ${teamName(w.teamAgainstName)} on ${night}, the ${ordinal(w.number)} of the ${w.seasonName} season. Watch the clip on WedgieTracker.`,
    image: youtubeThumbnail(w.videoUrl?.youtube),
    canonical: `${APP_URL}/all-wedgies?${buildAllWedgiesQuery({
      season: w.seasonName,
      wedgie: w.number,
    })}`,
  });
}

// generateMetadata reads the URL, so the page says on purpose that part of it waits for the
// request (Next 16 Cache Components); the heading still prerenders.
const Connection = async () => {
  await connection();
  return null;
};

export default async function Page() {
  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <h1 className="text-center text-6xl leading-none font-black uppercase md:text-7xl">
            <span className="text-shadow-darkpurple text-yellow relative z-10 block leading-none">
              All{" "}
            </span>
            <span className="text-pink relative z-0 mt-[-.4em] block text-[.5em] leading-none">
              Wedgies
            </span>
          </h1>

          <Suspense fallback={<LoaderWrapper />}>
            <AllWedgiesPage />
          </Suspense>
          <Suspense>
            <Connection />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex w-full justify-center">
      <div className="-mr-[3em] w-full max-w-[100px] md:max-w-[200px]">
        <Loader />
      </div>
    </div>
  );
};
