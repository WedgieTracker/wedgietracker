"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PRIOR_GAMES,
  RECENCY,
  SEASON_GAMES,
  blendedRate,
  computePace,
  normalRate,
} from "@wedgietracker/core/utils/paceCalculator";

interface PaceExplainerProps {
  data: {
    /** Completed seasons, oldest first */
    seasons: { name: string; wedgies: number; games: number }[];
    currentSeason: string;
    wedgiesThisSeason: number;
    gamesPlayed: number;
    pace: number;
  };
}

/** Each completed season's wedgies per game it actually played, oldest first. */
const ratesOf = (seasons: PaceExplainerProps["data"]["seasons"]) =>
  seasons.map((s) => s.wedgies / s.games);

/**
 * The pace the server stores, worked out the same way (server/pace.ts).
 * computePace has no answer before the first game, when the pace is simply
 * this season's wedgies plus a full season at the normal rate.
 */
function paceFor(rates: number[], wedgies: number, games: number) {
  if (games <= 0) return Math.round(wedgies + normalRate(rates) * SEASON_GAMES);
  return computePace({
    currentTotalWedgies: wedgies,
    currentTotalGames: games,
    seasonRates: rates,
  }).medianPace;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function PaceExplainer({ data }: PaceExplainerProps) {
  const { seasons } = data;
  const rates = ratesOf(seasons);
  const normal = normalRate(rates);
  const normalSeason = normal * SEASON_GAMES;
  const most = Math.max(...seasons.map((s) => s.wedgies), 1);
  // last season counts in full, each one before it RECENCY times the next
  const weightOf = (i: number) => RECENCY ** (seasons.length - 1 - i);
  const madeUp = PRIOR_GAMES * normal;

  const [games, setGames] = useState(data.gamesPlayed);
  const [wedgies, setWedgies] = useState(data.wedgiesThisSeason);
  const left = Math.max(0, SEASON_GAMES - games);
  const rate = blendedRate(wedgies, games, rates);
  const pace = paceFor(rates, wedgies, games);
  const isToday =
    games === data.gamesPlayed && wedgies === data.wedgiesThisSeason;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 text-white">
      <p className="text-center text-lg font-bold md:text-xl">
        The pace is our guess at how many wedgies the{" "}
        <span className="text-yellow">{data.currentSeason}</span> season will
        finish with.
      </p>

      <Section step="1" title="A normal season">
        <p className="mb-4 font-bold">
          Over the last{" "}
          <span className="text-pink">{seasons.length} completed seasons</span>,
          with recent ones counting a bit more, a normal season works out at one
          wedgie every{" "}
          <span className="text-yellow">{Math.round(1 / normal)} games</span>.
        </p>
        <ul className="flex flex-col gap-1.5">
          {seasons.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2 text-sm">
              <span className="w-16 shrink-0 font-bold text-white/70">
                {s.name}
              </span>
              <span className="relative h-5 flex-1">
                <span
                  className={`absolute inset-y-0 left-0 rounded-r-md ${
                    (rates[i] ?? 0) >= normal ? "bg-yellow" : "bg-pink"
                  }`}
                  style={{
                    width: `${(s.wedgies / most) * 100}%`,
                    opacity: 0.35 + 0.65 * weightOf(i),
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-[-3px] w-0.5 bg-white/70"
                  style={{ left: `${(normalSeason / most) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right font-black">
                {s.wedgies}
              </span>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-white/60">
                {pct(weightOf(i))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-white/60">
          Each season&apos;s wedgies are divided by the games it actually
          played, so the shortened 2019/20 and 2020/21 seasons count by how
          often wedgies happened, not by their smaller totals. Last season
          counts in full, the one before at 80%, then 64%, and so on, as the
          percentages on the right show. Yellow seasons had wedgies more often
          than normal, pink ones less. The white line is a normal season, about{" "}
          {Math.round(normalSeason)} wedgies.
        </p>
      </Section>

      <Section step="2" title="The season so far">
        <p className="font-bold">
          <span className="text-yellow">{data.wedgiesThisSeason}</span>{" "}
          {data.wedgiesThisSeason === 1 ? "wedgie" : "wedgies"} in{" "}
          <span className="text-yellow">{fmt(data.gamesPlayed)}</span> games,
          out of an estimated {fmt(SEASON_GAMES)} for the whole season. That
          leaves about{" "}
          <span className="text-pink">
            {fmt(Math.max(0, SEASON_GAMES - data.gamesPlayed))} games
          </span>{" "}
          to play.
        </p>
        <p className="mt-2 text-sm text-white/60">
          The total is an estimate. The 1,230 regular-season games are fixed,
          but how many play-in and playoff games there will be isn&apos;t known
          until the season ends.
        </p>
      </Section>

      <Section step="3" title="Mix in this season">
        <p className="mb-4 font-bold">
          {fmt(games)} {games === 1 ? "game is" : "games is"} too small a sample
          to trust on its own, so past seasons get a say worth{" "}
          {fmt(PRIOR_GAMES)} games, about half a season. The season starts off
          with {fmt(PRIOR_GAMES)} made-up games at the normal rate, and the real
          games go on top.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:justify-center md:gap-2">
          <Line>
            <Term
              value={`${Math.round(madeUp)} in ${fmt(PRIOR_GAMES)}`}
              label="made-up wedgies in games"
            />
          </Line>
          <Line op="+">
            <Term
              value={`${wedgies} in ${fmt(games)}`}
              label="real wedgies in games"
            />
          </Line>
          <Line op="=">
            <Term
              value={`1 in ${Math.round(1 / rate)}`}
              label="wedgies a game"
              highlight
            />
          </Line>
        </div>
        <p className="mt-4 text-sm text-white/60">
          {Math.round(madeUp)} + {wedgies} = {Math.round(madeUp + wedgies)}{" "}
          wedgies in {fmt(PRIOR_GAMES)} + {fmt(games)} ={" "}
          {fmt(PRIOR_GAMES + games)} games. The made-up games always stay{" "}
          {fmt(PRIOR_GAMES)}, while the real ones keep growing. Early on the
          past has most of the say, around midseason they count about the same,
          and by the end it is mostly this season.
        </p>
      </Section>

      <Section step="4" title="Put together">
        <p className="mb-4 font-bold">
          The games still to play go at that mixed rate, on top of this
          season&apos;s wedgies so far. Move the numbers below to try it.
        </p>
        <Formula
          wedgies={wedgies}
          left={left}
          every={Math.round(1 / rate)}
          pace={pace}
        />
        <p className="mt-3 text-center text-xs text-white/50">
          Rounded to whole numbers here. The pace uses the exact ones.
        </p>
        <div className="my-5 border-t border-white/10" />
        <label className="mb-1 flex justify-between font-bold">
          <span>Games played</span>
          <span className="text-yellow">{fmt(games)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={SEASON_GAMES}
          value={games}
          onChange={(e) => setGames(Number(e.target.value))}
          className="accent-yellow mb-5 w-full"
          aria-label="Games played"
        />
        <div className="mb-5 flex items-center justify-between font-bold">
          <span>Wedgies so far</span>
          <span className="flex items-center gap-3">
            <Stepper
              label="One fewer wedgie"
              onClick={() => setWedgies((w) => Math.max(0, w - 1))}
            >
              −
            </Stepper>
            <span className="text-yellow w-10 text-center text-2xl font-black">
              {wedgies}
            </span>
            <Stepper
              label="One more wedgie"
              onClick={() => setWedgies((w) => Math.min(200, w + 1))}
            >
              +
            </Stepper>
          </span>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            disabled={isToday}
            onClick={() => {
              setGames(data.gamesPlayed);
              setWedgies(data.wedgiesThisSeason);
            }}
            className="border-yellow text-yellow hover:bg-yellow hover:text-darkpurple disabled:hover:text-yellow rounded-full border-2 px-4 py-1 text-sm font-bold transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            BACK TO TODAY
          </button>
        </div>
      </Section>

      <Section title="Why it works this way">
        <ul className="flex list-disc flex-col gap-2 pl-5 font-bold">
          <li>
            We tested it on the 12 seasons from 2014/15 to 2025/26. At many
            points in each season, from the first weeks to the playoffs, we
            worked out what this pace would have said back then and compared it
            with how many wedgies that season actually finished with. On average
            it was about 4 wedgies off.
          </li>
          <li>
            Going by this season alone jumps around too much early on. In the
            first part of a season it misses by around 15 wedgies.
          </li>
          <li>
            Ignoring this season until the end misses too. Averaging past
            seasons alone ends up about 5 off.
          </li>
          <li>
            Early in any season every formula can be quite a bit off. The more
            games are played, the closer the pace gets to the final number.
          </li>
          <li>
            {fmt(SEASON_GAMES)} games is an estimate of a full season the way we
            count it, the 1,230 regular-season games plus a typical play-in and
            playoffs.
          </li>
        </ul>
      </Section>

      <Link
        href="/stats-for-nerds"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow w-full rounded-3xl border-2 py-1.5 text-center font-bold transition-all duration-300"
      >
        BACK TO STATS FOR NERDS
      </Link>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-darkpurple-dark rounded-3xl p-5 md:p-8">
      <h2 className="mb-3 flex items-center gap-3 text-2xl font-black uppercase md:text-3xl">
        {step && (
          <span className="bg-pink text-darkpurple inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl">
            {step}
          </span>
        )}
        <span className="text-yellow">{title}</span>
      </h2>
      {children}
    </section>
  );
}

/** wedgies so far + (games left ÷ games a wedgie) = pace */
function Formula({
  wedgies,
  left,
  every,
  pace,
}: {
  wedgies: number;
  left: number;
  every: number;
  pace: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:justify-center md:gap-2">
      <Line>
        <Term value={String(wedgies)} label="wedgies so far" />
      </Line>
      <Line op="+">
        <Op>(</Op>
        <Term value={fmt(left)} label="games left (est.)" />
        <Op>÷</Op>
        <Term value={String(every)} label="games a wedgie" />
        <Op>)</Op>
      </Line>
      <Line op="=">
        <Term value={String(pace)} label="pace" highlight />
      </Line>
    </div>
  );
}

/**
 * One step of a sum. On phones the steps stack with the operator in a column
 * on the left; from md up they sit in one row.
 */
function Line({ op, children }: { op?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-5 shrink-0 md:w-auto ${op ? "" : "md:hidden"}`}>
        {op && <Op>{op}</Op>}
      </span>
      {children}
    </div>
  );
}

function Term({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`rounded-xl px-3 py-1 text-2xl font-black md:text-3xl ${
          highlight ? "bg-yellow text-darkpurple" : "bg-darkpurple text-yellow"
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-center text-xs font-bold text-white/60 uppercase md:whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-pink block pt-1 text-center text-2xl font-black md:text-3xl">
      {children}
    </span>
  );
}

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="border-yellow text-yellow hover:bg-yellow hover:text-darkpurple flex h-9 w-9 items-center justify-center rounded-full border-2 text-xl font-black transition-colors"
    >
      {children}
    </button>
  );
}
