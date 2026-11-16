import { Text, type TextStyle } from "react-native";

import { colors, fonts } from "@/lib/theme";
import {
  isRealTeam,
  specialMatchup,
} from "@wedgietracker/core/utils/teamAliases";

/**
 * Port of apps/web/src/components/shared/Matchup.tsx, as nested text: "POR
 * vs SAC", or just "DAL" when the opponent isn't known. A wedgie that wasn't
 * in a normal game names the event instead: "★ All-Star Game".
 */
export function Matchup({
  wedgie,
  teamStyle,
}: {
  wedgie: {
    teamName: string;
    teamAgainstName: string;
    seasonName?: string | null;
  };
  teamStyle: TextStyle;
}) {
  const special = specialMatchup(wedgie);
  if (special) {
    return (
      <Text style={{ fontFamily: fonts.black, color: colors.cream }}>
        {special.star ? <Text style={{ color: "#FFD36B" }}>★ </Text> : null}
        {special.label}
      </Text>
    );
  }
  return (
    <>
      <Text style={teamStyle}>{wedgie.teamName}</Text>
      {isRealTeam(wedgie.teamAgainstName)
        ? ` vs ${wedgie.teamAgainstName}`
        : ""}
    </>
  );
}
