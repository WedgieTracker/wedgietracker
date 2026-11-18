import Link from "next/link";
import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";

interface SeasonCardProps {
  season: {
    name: string;
    totalGames: number;
    totalWedgies: number;
    isCurrent: boolean;
    leadPlayers: { names: string[]; count: number };
    leadTeams: { names: string[]; count: number };
  };
}

const teamName = (code: string) =>
  TEAMS.find((t) => t.code === code)?.fullName ?? code;

/** The leader's name, or how many tied when it's more than one. */
function leader(lead: { names: string[]; count: number }, full = false) {
  if (!lead.names.length) return "None yet";
  if (lead.names.length > 1) return `${lead.names.length} tied`;
  return full ? teamName(lead.names[0]!) : lead.names[0]!;
}

/**
 * One season: how many wedgies, a strip of games with one lit up for how
 * often a wedgie happened, the leading player and team, and links to watch
 * that season's wedgies or open its leaderboard.
 */
export function SeasonCard({ season }: SeasonCardProps) {
  const perWedgie = Math.max(
    1,
    Math.round(season.totalGames / season.totalWedgies),
  );
  const param = season.name.replace("/", "-");
  const live = season.isCurrent;

  return (
    <article
      className={`flex flex-col gap-3.5 rounded-[22px] border p-4 md:p-5 ${
        live
          ? "bg-badge grain border-[rgb(240_225_182/0.35)]"
          : "bg-panel border-violet/20"
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-cream text-[17px] font-black">{season.name}</h2>
        {live && (
          <span className="text-cream rounded-md bg-[rgb(240_225_182/0.2)] px-2 py-1 text-[10.5px] font-black tracking-[0.06em] uppercase">
            In progress
          </span>
        )}
      </header>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-cream text-[58px] leading-[0.88] font-black tracking-[-0.04em] italic">
            {season.totalWedgies}
          </p>
          <p className="text-cream/60 mt-1.5 text-[11.5px] font-black tracking-[0.14em] uppercase">
            Wedgies
          </p>
        </div>
        <div className="text-right">
          <p className="text-cream text-[30px] leading-[0.88] font-black tracking-[-0.03em] italic">
            {season.totalGames.toLocaleString("en-US")}
          </p>
          <p className="text-cream/60 mt-1.5 text-[11.5px] font-black tracking-[0.14em] uppercase">
            Games {live ? "so far" : "total"}
          </p>
        </div>
      </div>

      <div>
        <div aria-hidden="true" className="flex items-center gap-0.5">
          {Array.from({ length: perWedgie }, (_, i) => (
            <span
              key={i}
              className={`h-3.5 min-w-0 flex-1 rounded-[3px] ${
                i === perWedgie - 1
                  ? "bg-[#FF6FD8] shadow-[0_0_8px_rgb(255_111_216/0.6)]"
                  : "bg-cream/15"
              }`}
            />
          ))}
        </div>
        <p className="text-cream/60 mt-1.5 text-right text-[11.5px] font-extrabold">
          1 wedgie every <span className="text-cream">{perWedgie} games</span>
        </p>
      </div>

      <dl className="mt-auto grid gap-1 text-[13.5px] font-extrabold">
        {[
          ["Player", leader(season.leadPlayers), season.leadPlayers.count],
          ["Team", leader(season.leadTeams, true), season.leadTeams.count],
        ].map(([label, name, n]) => (
          <div
            key={label}
            className={`flex justify-between gap-2 border-t pt-1.5 ${
              live ? "border-cream/20" : "border-violet/20"
            }`}
          >
            <dt className="text-cream/55 text-[11px] font-black tracking-[0.05em] uppercase">
              {label}
            </dt>
            <dd className="text-cream truncate">
              {name}
              {n ? ` · ${n}` : ""}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/all-wedgies?${buildAllWedgiesQuery({ season: season.name })}`}
          className={`btn-sticker btn-sticker-sm min-h-10 text-[13px] ${live ? "btn-sticker-dark" : ""}`}
        >
          ▶ Watch them
        </Link>
        <Link
          href={`/standings?season=${param}`}
          className="text-cream hover:border-cream flex min-h-10 items-center justify-center rounded-[10px] border-2 border-[rgb(240_225_182/0.45)] text-[13px] font-black transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </article>
  );
}
