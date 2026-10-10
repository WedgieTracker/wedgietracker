export const WEDGIE_REPORT_FIELDS = [
  "player",
  "teams",
  "date",
  "type",
  "video",
  "position",
  "other",
] as const;

export type WedgieReportField = (typeof WEDGIE_REPORT_FIELDS)[number];
