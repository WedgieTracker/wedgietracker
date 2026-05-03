interface NavArrowProps {
  direction: "previous" | "next";
  enabled: boolean;
  onClick?: () => void;
}

const PREVIOUS_PATH = "M15 19l-7-7 7-7";
const NEXT_PATH = "M9 5l7 7-7 7";

function NavArrow({ direction, enabled, onClick }: NavArrowProps) {
  return (
    <button
      {...(enabled ? { onClick } : {})}
      className={`border-yellow bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple rounded-full border p-1 transition-all sm:p-2 ${
        !enabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""
      }`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={direction === "previous" ? PREVIOUS_PATH : NEXT_PATH}
        />
      </svg>
    </button>
  );
}

interface WedgieModalNavProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function WedgieModalNav({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: WedgieModalNavProps) {
  return (
    <div className="flex flex-row gap-1 sm:gap-3">
      <NavArrow
        direction="previous"
        enabled={hasPrevious}
        onClick={onPrevious}
      />
      <NavArrow direction="next" enabled={hasNext} onClick={onNext} />
    </div>
  );
}
