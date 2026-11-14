import Link from "next/link";

// Letter-spacing also trails the last character, so the same space on the left keeps it centred.
const LED = "font-mono tracking-[0.15em] pl-[0.15em]";

/** One side of the board: a label over glowing LED digits. */
function Board({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "pink";
}) {
  const glow =
    tone === "amber"
      ? "text-[#ffd36b] [text-shadow:0_0_10px_rgb(255_211_107/0.7)]"
      : "text-[#ff6fd8] [text-shadow:0_0_10px_rgb(255_111_216/0.7)]";
  return (
    <div className="rounded-[10px] bg-[#150b30] px-2 py-2.5 text-center">
      <div className={`${LED} text-cream/75 text-[11px]`}>{label}</div>
      <div
        className={`${LED} text-[54px] leading-[1.1] font-black tabular-nums ${glow}`}
      >
        {String(value).padStart(2, "0")}
      </div>
    </div>
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
      aria-label={`Season score: coffees ${coffees}, wedgies ${wedgies}`}
      className="w-full max-w-2xl rounded-[18px] border-2 border-[#2a1a5c] bg-[#0b0619] p-3.5 shadow-[inset_0_0_0_1px_rgb(255_211_107/0.08),0_12px_28px_rgb(5_2_20/0.45)]"
    >
      <div
        className={`${LED} text-center text-[11px] text-[#ffd36b] uppercase [text-shadow:0_0_6px_rgb(255_211_107/0.6)]`}
      >
        Season {season}
      </div>
      <div className="my-3 grid grid-cols-2 gap-2.5">
        <Board label="COFFEES" value={coffees} tone="amber" />
        <Board label="WEDGIES" value={wedgies} tone="pink" />
      </div>
      <p
        className={`${LED} text-cream/60 mb-3 text-center text-[11.5px] uppercase`}
      >
        {line}
      </p>
      <Link
        href="/support-us"
        className="btn-sticker btn-sticker-dark text-base"
      >
        Support us with a coffee donation
      </Link>
    </section>
  );
}
