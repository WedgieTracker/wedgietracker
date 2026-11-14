import Link from "next/link";

function MugIcon() {
  return (
    <svg
      viewBox="0 0 90 90"
      fill="none"
      aria-hidden="true"
      className="size-[30px]"
    >
      <g stroke="rgb(240 225 182 / 0.55)" strokeWidth="5" strokeLinecap="round">
        <path d="M36 16c-4-4 4-6 0-10" />
        <path d="M52 16c-4-4 4-6 0-10" />
      </g>
      <rect x="18" y="52" width="54" height="34" fill="#6b3a1f" />
      <rect
        x="18"
        y="22"
        width="54"
        height="64"
        rx="6"
        stroke="#f0e1b6"
        strokeWidth="6"
      />
      <path d="M72 38h8a10 10 0 0 1 0 20h-8" stroke="#f0e1b6" strokeWidth="6" />
    </svg>
  );
}

/** A ball stuck between the rim and the backboard. */
function WedgieIcon() {
  return (
    <svg
      viewBox="0 0 90 90"
      fill="none"
      aria-hidden="true"
      className="size-[30px]"
    >
      <path
        d="M74 10V66"
        stroke="#f0e1b6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M20 54H74"
        stroke="#f0e1b6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M25 54l6 26h30l6-26M38 54l2 26M53 54l-2 26"
        stroke="#f0e1b6"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity=".7"
      />
      <circle
        cx="58"
        cy="41"
        r="13"
        fill="#ff8a3d"
        stroke="#14092e"
        strokeWidth="3"
      />
      <path
        d="M45 41h26M58 28v26M50 31q6 10 0 20M66 31q-6 10 0 20"
        stroke="#5a2408"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Side({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-1.5">
      <span className="bg-night/30 grid size-11 place-items-center rounded-[14px]">
        {icon}
      </span>
      <span className="text-cream/70 text-xs font-extrabold">{label}</span>
    </span>
  );
}

/** This season's coffees against this season's wedgies, like a game score. */
export function CoffeeScoreboard({
  season,
  coffees,
  wedgies,
}: {
  season: string | null;
  coffees: number;
  wedgies: number;
}) {
  const lead = coffees - wedgies;
  const line =
    lead > 0
      ? `Coffees lead by ${lead}`
      : lead < 0
        ? "Every coffee scores a point"
        : "All square";

  return (
    <section
      aria-label={`Coffees ${coffees}, wedgies ${wedgies} this season`}
      className="bg-badge grain w-full max-w-2xl overflow-hidden rounded-[22px] shadow-[0_12px_28px_rgb(5_2_20/0.45)]"
    >
      <div className="bg-night/30 text-cream/70 flex justify-between px-4 py-2.5 text-xs font-extrabold">
        <span>{season}</span>
        <span>Season score</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-[18px] pb-1.5">
        <span className="flex items-center gap-2.5">
          <Side icon={<MugIcon />} label="Coffees" />
          <span className="text-cream text-shadow-badge flex-1 text-right text-[52px] leading-none font-black tracking-[-0.04em] italic">
            {coffees}
          </span>
        </span>
        <span className="text-cream/70 px-2 text-[13px] font-black italic">
          vs
        </span>
        <span className="flex items-center gap-2.5">
          <span className="text-cream text-shadow-badge flex-1 text-left text-[52px] leading-none font-black tracking-[-0.04em] italic">
            {wedgies}
          </span>
          <Side icon={<WedgieIcon />} label="Wedgies" />
        </span>
      </div>
      <p className="text-cream/85 px-4 pt-1.5 text-center text-[13.5px] font-extrabold">
        {line}
      </p>
      <Link
        href="/support-us"
        className="bg-cream text-night focus-visible:outline-cream mx-4 mt-3.5 mb-4 flex min-h-[52px] items-center justify-center rounded-full text-base font-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Buy a coffee
      </Link>
    </section>
  );
}
