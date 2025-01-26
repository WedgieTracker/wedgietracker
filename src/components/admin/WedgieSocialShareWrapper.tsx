import type { WedgieWithTypes } from "~/types/wedgie";
import dynamic from "next/dynamic";

const DevWedgieSocialShare =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          // @ts-expect-error -- Development-only import that won't exist in production
          import("../../components/dev/WedgieSocialShare")
            .then(
              (mod: {
                WedgieSocialShare: React.ComponentType<{
                  wedgie: WedgieWithTypes;
                }>;
              }) => mod.WedgieSocialShare,
            )
            .catch(() => () => null),
        { ssr: false },
      )
    : () => null;

export function WedgieSocialShareWrapper({
  wedgie,
}: {
  wedgie: WedgieWithTypes;
}) {
  return process.env.NODE_ENV === "development" ? (
    <DevWedgieSocialShare wedgie={wedgie} />
  ) : null;
}
