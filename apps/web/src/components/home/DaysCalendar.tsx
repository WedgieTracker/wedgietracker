import { Permanent_Marker } from "next/font/google";

const marker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

/** The stamp's inks: the ball in pink, the banner and its lettering darker. */
const BALL_INK = "#ff4fc8";
const BANNER_INK = "#ad3792";
const PAPER = "#f0e1b6";

/**
 * Rubber-stamped "NEW WEDGIE!" for the day of a new wedgie: a reversed
 * basketball (solid ink, seams left in the paper) behind an inked banner.
 * The ball's lines stop at the banner's edge, as a real stamp prints, and its
 * seams spin slowly. A patch of plain paper under the banner keeps the
 * lettering clear of the faded count printed behind it.
 */
function NewWedgieStamp() {
  return (
    <>
      <span
        aria-hidden="true"
        className="wt-stamp-patch bg-cream absolute top-[52%] left-1/2 h-[37%] w-[84%] -translate-x-1/2 -translate-y-1/2 -rotate-[10deg] rounded-md"
      />
      {/* The blend sits on a wrapper that never animates, so starting the
          animation inside it can't change how the ink renders. */}
      <span
        aria-hidden="true"
        className="absolute top-[52%] left-1/2 [isolation:isolate] h-[74%] w-[88%] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply [will-change:transform]"
      >
        <span className="wt-stamp-in block size-full -rotate-[10deg] [will-change:transform,opacity]">
          <svg viewBox="0 0 120 104" className="size-full overflow-visible">
            <defs>
              <mask
                id="wt-stamp-cut"
                maskUnits="userSpaceOnUse"
                x="-10"
                y="-10"
                width="140"
                height="124"
              >
                <rect x="-10" y="-10" width="140" height="124" fill="#fff" />
                <rect
                  x="-2"
                  y="26"
                  width="124"
                  height="52"
                  rx="8"
                  fill="#000"
                />
              </mask>
            </defs>
            <g mask="url(#wt-stamp-cut)">
              <g className="wt-stamp-spin">
                <g transform="translate(10 2)">
                  <circle cx="50" cy="50" r="48" fill={BALL_INK} />
                  <g fill="none" stroke={PAPER} strokeWidth="3.5">
                    <path d="M4 50h92M50 4v92" />
                    <path d="M18 18q22 32 0 64M82 18q-22 32 0 64" />
                  </g>
                </g>
              </g>
            </g>
            <rect
              x="2"
              y="30"
              width="116"
              height="44"
              rx="6"
              fill="none"
              stroke={BANNER_INK}
              strokeWidth="3.5"
            />
            <g
              fill={BANNER_INK}
              stroke={BANNER_INK}
              strokeWidth="0.7"
              paintOrder="stroke"
              fontSize="19"
              textAnchor="middle"
              style={{ fontFamily: marker.style.fontFamily }}
            >
              <text x="60" y="50">
                NEW
              </text>
              <text x="60" y="69">
                WEDGIE!
              </text>
            </g>
          </svg>
        </span>
      </span>
    </>
  );
}

/**
 * A tear-off pad counting the days since the last wedgie, with the sheets
 * below peeking out. On the day of a new one, "NEW WEDGIE!" is stamped over a
 * faded zero.
 */
export function DaysCalendar({ days }: { days: number }) {
  const isNew = days === 0;
  const label = isNew
    ? "New wedgie today"
    : `${days} ${days === 1 ? "day" : "days"} without a wedgie`;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative isolate w-[132px] rounded-[14px] shadow-[0_8px_18px_rgb(5_2_20/0.45)] md:w-[170px]"
    >
      {/* the sheets underneath, a little turned and peeking out */}
      <span
        aria-hidden="true"
        className="absolute inset-x-[5px] top-[26px] -bottom-2.5 -z-20 origin-top-right rotate-[1.6deg] rounded-b-[14px] bg-[#ddcc98] shadow-[0_1px_0_rgb(42_22_96/0.22),0_6px_12px_rgb(5_2_20/0.35)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0.5 top-[26px] -bottom-[5px] -z-10 origin-top-left -rotate-[1.4deg] rounded-b-[14px] bg-[#e8d9ab] shadow-[0_1px_0_rgb(42_22_96/0.22),0_6px_12px_rgb(5_2_20/0.35)]"
      />
      <div className="bg-glow before:bg-cream after:bg-cream relative h-[26px] rounded-t-[14px] before:absolute before:-top-1.5 before:left-[26px] before:h-[18px] before:w-2 before:rounded-sm before:shadow-[0_2px_0_rgb(0_0_0/0.25)] before:content-[''] after:absolute after:-top-1.5 after:right-[26px] after:h-[18px] after:w-2 after:rounded-sm after:shadow-[0_2px_0_rgb(0_0_0/0.25)] after:content-['']" />
      <div className="bg-cream relative flex min-h-[118px] flex-col items-center justify-center overflow-hidden rounded-b-[14px] pt-1.5 pb-3.5 text-center shadow-[0_1px_0_rgb(42_22_96/0.18)] md:min-h-[156px]">
        <span
          className={`text-[64px] leading-none font-black tracking-[-0.04em] text-[#502394] italic md:text-[84px] ${isNew ? "opacity-30" : ""}`}
        >
          {days}
        </span>
        <span
          className={`text-night mt-0.5 text-xs leading-tight font-black md:text-sm ${isNew ? "opacity-30" : ""}`}
        >
          {days === 1 ? "day" : "days"} without
          <br />a wedgie
        </span>
        {isNew && <NewWedgieStamp />}
      </div>
    </div>
  );
}
