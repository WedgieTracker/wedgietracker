/**
 * The colour of a wedgie's big number on its row: a step along the badge's
 * blue to violet to pink, chosen by the number itself, so a wedgie keeps its
 * colour wherever it shows (app, site, any list or filter).
 *
 * #1 is blue and #13 pink, then the steps run back down to blue at #25 and so
 * on, so a long list flows without jumping from pink straight back to blue.
 */
export const WEDGIE_NUMBER_RAMP = [
  "#5F84E6",
  "#6A7BEA",
  "#7472EE",
  "#7E6BF0",
  "#8865F2",
  "#9160F4",
  "#9A5CF5",
  "#A65AF0",
  "#B358E8",
  "#C158DF",
  "#D05CD4",
  "#E063CA",
  "#FF6FD8",
] as const;

const STEPS = WEDGIE_NUMBER_RAMP.length - 1;

export function wedgieNumberColour(number: number | null | undefined): string {
  const n = Math.max(1, Math.floor(number ?? 1));
  const p = (n - 1) % (2 * STEPS);
  return WEDGIE_NUMBER_RAMP[p <= STEPS ? p : 2 * STEPS - p]!;
}
