import { Wedgie } from "~/components/home/Wedgie";
import { Loader } from "~/components/loader";
import type { WedgieWithTypes } from "~/types/wedgie";

interface WedgieGridProps {
  wedgies: WedgieWithTypes[];
  isLoading: boolean;
  onWedgieClick?: (wedgie: WedgieWithTypes) => void;
}

export function WedgieGrid({
  wedgies,
  isLoading,
  onWedgieClick,
}: WedgieGridProps) {
  if (isLoading) {
    return (
      <div className="items-top flex w-full justify-center">
        <div className="-mr-[3em] w-full max-w-[100px] md:max-w-[200px]">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6">
      {wedgies.map((wedgie, index) => (
        <Wedgie
          key={wedgie.id}
          wedgie={wedgie}
          variant="small"
          onWedgieClick={() => onWedgieClick?.(wedgie)}
          hasPrevious={index > 0}
          hasNext={index < wedgies.length - 1}
          previousWedgie={index > 0 ? wedgies[index - 1] : undefined}
          nextWedgie={
            index < wedgies.length - 1 ? wedgies[index + 1] : undefined
          }
        />
      ))}
    </div>
  );
}
