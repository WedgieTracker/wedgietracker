import {
  isRealTeam,
  specialMatchup,
} from "@wedgietracker/core/utils/teamAliases";

/**
 * "POR vs SAC", or just "DAL" when the opponent isn't known. A wedgie that
 * wasn't in a normal game names the event instead: "★ All-Star Game".
 */
export function Matchup({
  wedgie,
  teamClassName,
}: {
  wedgie: {
    teamName: string;
    teamAgainstName: string;
    seasonName?: string | null;
  };
  teamClassName: string;
}) {
  const special = specialMatchup(wedgie);
  if (special) {
    return (
      <span className="text-cream font-black">
        {special.star && (
          <span aria-hidden="true" className="mr-1 text-[#ffd66b]">
            ★
          </span>
        )}
        {special.label}
      </span>
    );
  }
  return (
    <>
      <span className={teamClassName}>{wedgie.teamName}</span>
      {isRealTeam(wedgie.teamAgainstName) && ` vs ${wedgie.teamAgainstName}`}
    </>
  );
}
