"use client";

import Link from "next/link";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";
import { TypingStats } from "./TypingStats";
import { Wave } from "../home/Wave";
import { Counter } from "../ui/Counter";
import { PaceGauge } from "../home/PaceGauge";
import { COURT_PATHS, VIEW_H, VIEW_W } from "../home/CourtPositionDiagram";
import type { api } from "~/trpc/server";

type NerdStats = Awaited<ReturnType<typeof api.wedgie.getNerdStats>>;
type NerdExtras = Awaited<ReturnType<typeof api.wedgie.getNerdExtras>>;

const nickname = (code: string) =>
  TEAMS.find((t) => t.code === code)?.nickname ?? code;
const nf = (n: number) => n.toLocaleString("en-US");
const niceDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-panel border-violet/20 relative flex flex-col overflow-hidden rounded-[22px] border p-[18px] ${className}`}
    >
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-cream/60 text-[11.5px] font-black tracking-[0.12em] uppercase">
      {children}
    </h2>
  );
}

function Big({
  children,
  className = "text-[64px]",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-cream mt-2 leading-[0.88] font-black tracking-[-0.04em] italic ${className}`}
    >
      {children}
    </p>
  );
}

function Line({
  children,
  bottom = false,
}: {
  children: React.ReactNode;
  bottom?: boolean;
}) {
  return (
    <p
      className={`text-cream/75 [&_b]:text-cream text-sm leading-snug font-extrabold ${bottom ? "mt-auto pt-3" : "mt-2"}`}
    >
      {children}
    </p>
  );
}

function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="btn-sticker btn-sticker-sm inline-flex min-h-10 self-start px-4 text-[13px]"
    >
      {children}
    </Link>
  );
}

/** Tied leaders: how many, then every name. */
function Leaders({
  label,
  names,
  count,
  plural,
}: {
  label: string;
  names: string[];
  count: number;
  plural: string;
}) {
  if (!names.length) return null;
  return (
    <div className="mt-3 first:mt-0">
      <Kicker>{label}</Kicker>
      <Line>
        {names.length === 1 ? (
          <>
            <b>{names[0]}</b> leads with {count}
          </>
        ) : (
          <>
            <b>
              {names.length} {plural}
            </b>{" "}
            tied on {count}
          </>
        )}
      </Line>
      {names.length > 1 && (
        <p className="mt-2.5 flex flex-wrap gap-1.5">
          {names.map((n) => (
            <span
              key={n}
              className="bg-violet/20 text-cream rounded-full px-2.5 py-1 text-[12.5px] font-extrabold"
            >
              {n}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="mt-3 grid gap-1.5">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="grid grid-cols-[8.75rem_1fr_28px] items-center gap-2 text-[12.5px] font-extrabold"
        >
          <span className="text-cream truncate">{r.label}</span>
          <span className="bg-violet/20 h-2 overflow-hidden rounded-full">
            <span
              className={`block h-full rounded-full ${i === 0 ? "bg-[#F25CB5] shadow-[0_0_8px_rgb(242_92_181/0.6)]" : "bg-button"}`}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="text-cream/65 text-right tabular-nums">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function Columns({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="mt-4 flex h-28 items-end gap-1.5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
        >
          <span className="text-cream/60 text-[10.5px] font-black tabular-nums">
            {r.count}
          </span>
          <span
            className={`w-full rounded-t-md rounded-b-sm ${r.count === max ? "bg-[#F25CB5] shadow-[0_0_8px_rgb(242_92_181/0.5)]" : "bg-violet/40"}`}
            style={{ height: `${(r.count / max) * 100}%` }}
          />
          <span className="text-cream/60 text-[10.5px] font-black">
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CourtHeat({ points }: { points: { x: number; y: number }[] }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`Where ${points.length} wedgies happened on the court`}
      className="my-auto block w-full"
    >
      {COURT_PATHS.map((d) => (
        <path key={d.slice(0, 12)} d={d} fill="rgb(240 225 182 / 0.55)" />
      ))}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={(p.x / 100) * VIEW_W}
          cy={(p.y / 100) * VIEW_H}
          r={9}
          fill="#F25CB5"
          fillOpacity={0.38}
        />
      ))}
    </svg>
  );
}

function Section({
  title,
  hideTitle = false,
  children,
}: {
  title: string;
  /** Keep the heading for screen readers only. */
  hideTitle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full max-w-2xl">
      <h2
        className={
          hideTitle
            ? "sr-only"
            : "text-cream mb-3 text-[21px] font-extrabold tracking-[-0.01em]"
        }
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * The right-hand column of Stats for nerds, beside the home hero: this
 * season, all time, then where, how and when wedgies happen, records and
 * career leaders.
 */
export function StatsForNerds({
  stats,
  extras,
}: {
  stats: NerdStats;
  extras: NerdExtras;
}) {
  const topTeamCount = stats.leaders.teams[0]?.wedgies ?? 0;
  const teamLeaders = stats.leaders.teams
    .filter((t) => t.wedgies === topTeamCount && topTeamCount > 0)
    .map((t) => t.name);
  const playerLeaders = stats.leaders.players.map((p) => p.name);
  const playerTop = stats.leaders.players[0]?.count ?? 0;
  const perGames = Math.round(
    stats.totalGamesOverall / Math.max(1, stats.totalWedgiesOverall),
  );
  const { records } = extras;
  const gameDate = (name: string) => /\d{4}-\d{2}-\d{2}/.exec(name)?.[0] ?? "";

  const fillPercentage = Math.min((stats.wedgiesThisSeason / 50) * 100, 100);
  const diff = stats.pace - stats.averageLastTenSeasons;

  return (
    <div className="flex w-full flex-col lg:flex-row">
      <div className="flex w-full flex-col items-center justify-center gap-5 px-4 py-6 lg:sticky lg:top-20 lg:h-[calc(100svh-80px)] lg:w-1/2 lg:px-8">
        <p className="text-cream text-xl font-extrabold md:text-2xl">
          In the{" "}
          <span className="bg-violet rounded-md px-2 py-0.5">
            {stats.currentSeason}
          </span>{" "}
          season
        </p>
        <div className="border-violet/20 w-full max-w-xl overflow-hidden rounded-[22px] border">
          <div className="bg-badge grain relative flex min-h-[20em] flex-col items-center justify-center overflow-hidden p-8">
            <Wave fillPercentage={fillPercentage} showConfetti />
            <div className="bg-panel/50 relative z-10 w-full max-w-[22rem] rounded-lg p-4 text-center">
              <p className="text-cream text-sm leading-none font-bold md:text-base">
                WE&apos;RE AT
              </p>
              <p className="text-cream text-shadow-badge text-[clamp(7rem,6rem+6vw,11rem)] leading-[0.88] font-black">
                <Counter end={stats.wedgiesThisSeason} />
              </p>
              <p className="text-cream text-shadow-badge mt-1 text-4xl leading-none font-black md:text-5xl">
                WEDGIES
              </p>
            </div>
          </div>
          <div className="bg-panel px-6 py-5">
            <TypingStats stats={stats.statsPerWedgie} />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-10 px-[18px] pt-2 pb-6 lg:w-1/2 lg:px-8 lg:pt-6">
        <Section title="Pace" hideTitle>
          <Card className="items-center text-center">
            <div className="mx-auto w-full max-w-[245px]">
              <PaceGauge
                pace={stats.pace}
                record={stats.previousRecord}
                recordSeason={null}
                bare
              />
            </div>
            <Line>
              <b>
                {Math.abs(diff)} {diff >= 0 ? "more" : "fewer"}
              </b>{" "}
              than the average of {stats.averageLastTenSeasons} over the past{" "}
              {stats.averageSeasonsCount} seasons.
            </Line>
            <div className="mt-4">
              <More href="/stats-for-nerds/pace">How the pace works</More>
            </div>
          </Card>
        </Section>

        <Section title={`${stats.currentSeason} so far`} hideTitle>
          <Card>
            <div className="flex items-center gap-4">
              <div className="bg-badge grain text-cream text-shadow-badge grid size-20 shrink-0 place-items-center rounded-2xl pr-[0.12em] text-[44px] leading-none font-black italic">
                {stats.gamesSinceLastWedgie ?? 0}
              </div>
              <div>
                <Kicker>
                  {stats.gamesSinceLastWedgie === 1 ? "Game" : "Games"} since
                  the last wedgie
                </Kicker>
                {stats.lastWedgiePlayer && (
                  <p className="text-cream mt-1 text-[22px] leading-tight font-black">
                    {stats.lastWedgiePlayer}
                  </p>
                )}
              </div>
            </div>
            <div className="border-violet/20 mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 [&>div]:mt-0">
              <Leaders
                label="Leading teams"
                names={teamLeaders.map(nickname)}
                count={topTeamCount}
                plural="teams"
              />
              <Leaders
                label="Leading players"
                names={playerLeaders}
                count={playerTop}
                plural="players"
              />
            </div>
            <div className="mt-4">
              <More href="/standings">Leaderboard</More>
            </div>
          </Card>
        </Section>

        <section className="grid w-full max-w-2xl gap-3.5 sm:grid-cols-[0.8fr_1.2fr]">
          <h2 className="sr-only">All time</h2>
          <Card>
            <Kicker>All time</Kicker>
            <Big>{nf(stats.totalWedgiesOverall)}</Big>
            <Line>
              wedgies over <b>{stats.totalSeasonsOverall} seasons</b> and{" "}
              <b>{nf(stats.totalGamesOverall)} games</b>. One every{" "}
              <b>{perGames} games</b>.
            </Line>
            <div className="mt-auto pt-4">
              <More href="/seasons-history">Seasons history</More>
            </div>
          </Card>
          <Card>
            <h3 className="sr-only">Where they happen</h3>
            <CourtHeat points={extras.positions} />
          </Card>
        </section>

        <Section title="Shot types">
          <Card>
            <Bars
              rows={extras.types
                .slice(0, 8)
                .map((t) => ({ label: t.name, count: t.count }))}
            />
          </Card>
        </Section>

        <Section title="When in the game">
          <Card>
            <Columns rows={extras.quarters} />
          </Card>
        </Section>

        <Section title="Records">
          <Card>
            <dl className="grid gap-3">
              {[
                records.drought.games > 0 && [
                  nf(records.drought.games),
                  `games without a wedgie, from ${records.drought.fromPlayer} on ${niceDate(records.drought.fromDate)} to ${records.drought.toPlayer} on ${niceDate(records.drought.toDate)}`,
                ],
                records.mostInGame && [
                  records.mostInGame.count,
                  `in one game: ${records.mostInGame.game.replace(/ - .*/, "").replace(" @ ", " vs ")}, ${niceDate(gameDate(records.mostInGame.game))}`,
                ],
                [
                  records.mostInNight.count,
                  `in one night: ${records.mostInNight.dates.map(niceDate).join(" and ")}`,
                ],
                [records.multiGames, "games with more than one wedgie"],
              ]
                .filter((r): r is [string | number, string] => !!r)
                .map(([n, text]) => (
                  <div
                    key={text}
                    className="grid grid-cols-[3.75rem_1fr] items-center gap-2.5"
                  >
                    <dt className="text-cream text-center text-[30px] leading-none font-black tracking-[-0.03em] italic">
                      {n}
                    </dt>
                    <dd className="text-cream/75 text-[13.5px] leading-snug font-extrabold">
                      {text}
                    </dd>
                  </div>
                ))}
            </dl>
          </Card>
        </Section>

        <Section title="Career leaders">
          <Card>
            <Bars
              rows={extras.career.map((p) => ({
                label: p.name,
                count: p.count,
              }))}
            />
          </Card>
        </Section>
      </div>
    </div>
  );
}
