interface GameMomentInput {
  /** 1-4 for quarters, 5 and up for overtimes. */
  period: number | null;
  /** Game clock as shown on the broadcast, e.g. "2:51" or "0:43.7". */
  gameClock: string | null;
  /** Score of the wedgie's team and of its opponent at that moment. */
  teamScore?: number | null;
  opponentScore?: number | null;
}

function clockSeconds(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2}(?:\.\d+)?)$/.exec(clock.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Garbage time in the fourth quarter, using Cleaning the Glass's thresholds:
 * a 25+ point lead with 12-9 minutes left, 20+ with 9-6, 10+ with under 6.
 */
function isGarbageTime(secondsLeft: number, margin: number): boolean {
  if (secondsLeft > 540) return margin >= 25;
  if (secondsLeft > 360) return margin >= 20;
  return margin >= 10;
}

/**
 * Describes when in the game a wedgie happened as a band rather than an
 * exact time: "Early Q2", "Late Q1", "Final minute of Q3", "Clutch time"
 * (last five minutes of Q4 or overtime within five points, the NBA's
 * definition), "Garbage time" or "Overtime". Returns null without a clock.
 */
export function gameMoment({
  period,
  gameClock,
  teamScore,
  opponentScore,
}: GameMomentInput): string | null {
  if (!period || !gameClock) return null;
  const seconds = clockSeconds(gameClock);
  if (seconds === null) return null;

  const margin =
    typeof teamScore === "number" && typeof opponentScore === "number"
      ? Math.abs(teamScore - opponentScore)
      : null;
  const crunch = period >= 5 || (period === 4 && seconds <= 300);

  if (period === 4 && margin !== null && isGarbageTime(seconds, margin)) {
    return "Garbage time";
  }
  if (crunch && margin !== null && margin <= 5) return "Clutch time";
  if (period >= 5) return "Overtime";
  if (period <= 3 && seconds <= 60) return `Final minute of Q${period}`;
  return `${seconds > 360 ? "Early" : "Late"} Q${period}`;
}
