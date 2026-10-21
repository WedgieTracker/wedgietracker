"use client";

import Link from "next/link";
import { useState } from "react";
import {
  SEASON_GAMES,
  computePace,
} from "@wedgietracker/core/utils/paceCalculator";

interface PaceExplainerProps {
  data: {
    seasons: { name: string; wedgies: number }[];
    currentSeason: string;
    wedgiesThisSeason: number;
    gamesPlayed: number;
    pace: number;
  };
}

/**
 * The pace the server stores, worked out the same way: computePace with each
 * completed season as its total spread over a full schedule (server/pace.ts).
 * computePace has no answer before the first game, when the pace is simply the
 * average season plus this season's wedgies so far.
 */
function paceFor(
  seasons: PaceExplainerProps["data"]["seasons"],
  wedgies: number,
  games: number,
) {
  const seasonRates = seasons.map((s) => s.wedgies / SEASON_GAMES);
  const average =
    seasons.reduce((acc, s) => acc + s.wedgies, 0) / (seasons.length || 1);
  if (games <= 0) return Math.round(wedgies + average);
  return computePace({
    currentTotalWedgies: wedgies,
    currentTotalGames: games,
    seasonRates,
  }).medianPace;
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function PaceExplainer({ data }: PaceExplainerProps) {
  const { seasons } = data;
  const average =
    seasons.reduce((acc, s) => acc + s.wedgies, 0) / (seasons.length || 1);
  const most = Math.max(...seasons.map((s) => s.wedgies), 1);

  const [games, setGames] = useState(data.gamesPlayed);
  const [wedgies, setWedgies] = useState(data.wedgiesThisSeason);
  const left = Math.max(0, SEASON_GAMES - games);
  const pace = paceFor(seasons, wedgies, games);
  const isToday =
    games === data.gamesPlayed && wedgies === data.wedgiesThisSeason;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 text-white">
      <p className="text-center text-lg font-bold md:text-xl">
        The pace is our guess at how many wedgies the{" "}
        <span className="text-yellow">{data.currentSeason}</span> season will
        finish with. It starts from a normal season and adds the wedgies we have
        had so far.
      </p>

      <Section step="1" title="A normal season">
        <p className="mb-4 font-bold">
          Over the last{" "}
          <span className="text-pink">{seasons.length} completed seasons</span>{" "}
          we tracked an average of{" "}
          <span className="text-yellow">{Math.round(average)}</span> wedgies a
          season.
        </p>
        <ul className="flex flex-col gap-1.5">
          {seasons.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-sm">
              <span className="w-16 shrink-0 font-bold text-white/70">
                {s.name}
              </span>
              <span className="relative h-5 flex-1">
                <span
                  className={`absolute inset-y-0 left-0 rounded-r-md ${
                    s.wedgies >= average ? "bg-yellow" : "bg-pink"
                  }`}
                  style={{ width: `${(s.wedgies / most) * 100}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-[-3px] w-0.5 bg-white/70"
                  style={{ left: `${(average / most) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right font-black">
                {s.wedgies}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-white/60">
          Yellow seasons beat the average, pink ones fell short. The white line
          is the average. The pace works with the exact average,{" "}
          {average.toFixed(1)}, and only rounds at the end.
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
          The total is an estimate: the 1,230 regular-season games are fixed,
          but how many play-in and playoff games there will be isn&apos;t known
          until the season ends.
        </p>
      </Section>

      <Section step="3" title="Put together">
        <p className="mb-4 font-bold">
          We expect the games still to play to go like a normal season, and add
          this season&apos;s wedgies so far:
        </p>
        <Formula
          wedgies={data.wedgiesThisSeason}
          average={average}
          left={Math.max(0, SEASON_GAMES - data.gamesPlayed)}
          pace={paceFor(seasons, data.wedgiesThisSeason, data.gamesPlayed)}
        />
      </Section>

      <Section step="4" title="Try it">
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
        <Formula wedgies={wedgies} average={average} left={left} pace={pace} />
        <div className="mt-4 flex justify-center">
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
            Only completed seasons go into the average. A new season&apos;s own
            rate swings wildly over its first few games, so it only counts
            through the wedgies it has already had.
          </li>
          <li>
            Every completed season counts as its total, including the shortened
            2019/20 and 2020/21 seasons.
          </li>
          <li>
            {fmt(SEASON_GAMES)} games is an estimate of a full season the way we
            count it: the 1,230 regular-season games plus a typical play-in and
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

/** wedgies so far + average × (games left ÷ season games) = pace */
function Formula({
  wedgies,
  average,
  left,
  pace,
}: {
  wedgies: number;
  average: number;
  left: number;
  pace: number;
}) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3 text-center">
      <Term value={String(wedgies)} label="wedgies so far" />
      <Op>+</Op>
      <Term value={String(Math.round(average))} label="normal season" />
      <Op>×</Op>
      <Term
        value={`${fmt(left)}/${fmt(SEASON_GAMES)}`}
        label="of the season left (est.)"
      />
      <Op>=</Op>
      <Term value={String(pace)} label="pace" highlight />
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
      <span className="mt-1 text-xs font-bold text-white/60 uppercase">
        {label}
      </span>
    </div>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-pink pt-1 text-2xl font-black md:text-3xl">
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
