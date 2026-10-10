"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const PRESETS = [1, 3, 5];
const PER_MUG = 5;
const MAX_MUGS_SHOWN = 3;
const MAX_COFFEES = 50;

/** The boosts a round of coffees gives me, like a player's ratings. */
const ATTRIBUTES = [
  "Three-point shot",
  "Mid-range shot",
  "Free throw",
  "Ball handle",
  "Pass accuracy",
  "Offensive rebound",
  "Perimeter defense",
  "Interior defense",
  "Block",
  "Steal",
  "Speed",
  "Vertical",
  "Stamina",
  "Hustle",
  "Clutch",
  "Basketball IQ",
  "Wedgie radar",
  "Rim stickiness",
];

/**
 * Cycles through the attributes in a fresh random order each visit, unless
 * reduced motion is asked for. The first render keeps the list order so the
 * server and browser agree; the shuffle happens once mounted.
 */
function useRotatingAttribute() {
  const [order, setOrder] = useState(ATTRIBUTES);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const shuffled = [...ATTRIBUTES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    setOrder(shuffled);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % ATTRIBUTES.length),
      1800,
    );
    return () => clearInterval(timer);
  }, []);
  return order[index]!;
}

/** The boost badge levels up with the number of coffees, 2K style. */
function badgeTier(count: number) {
  if (count >= 20)
    return {
      name: "Hall of Fame",
      className: "wt-hof bg-linear-to-r from-pink to-[#7a1fff] text-white",
      sparkle: true,
    };
  if (count >= 10)
    return {
      name: "Gold",
      className: "wt-shine bg-[#c99a1e] text-white",
      sparkle: false,
    };
  if (count >= 5)
    return {
      name: "Silver",
      className: "wt-shine bg-[#8a94a3] text-white",
      sparkle: false,
    };
  if (count >= 2)
    return {
      name: "Bronze",
      className: "bg-[#a8642e] text-white",
      sparkle: false,
    };
  return { name: "", className: "bg-darkpurple text-yellow", sparkle: false };
}

/** A mug, filled to `level` (0-1) with a smooth pour when it changes. */
function Mug({ level, small }: { level: number; small: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={small ? "size-16" : "size-28"}
      fill="none"
    >
      <defs>
        <clipPath id={`mug-inside-${small ? "s" : "l"}`}>
          <rect x="18" y="22" width="54" height="64" rx="6" />
        </clipPath>
      </defs>
      {level > 0 && (
        <g
          className="text-darkpurple/40"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path className="wt-steam" d="M36 16c-4-4 4-6 0-10" />
          <path
            className="wt-steam"
            style={{ animationDelay: "0.6s" }}
            d="M52 16c-4-4 4-6 0-10"
          />
        </g>
      )}
      <g clipPath={`url(#mug-inside-${small ? "s" : "l"})`}>
        <rect
          x="18"
          y="22"
          width="54"
          height="64"
          className="fill-[#6b3a1f]"
          style={{
            transform: `scaleY(${level})`,
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)",
          }}
        />
      </g>
      <rect
        x="18"
        y="22"
        width="54"
        height="64"
        rx="6"
        className="stroke-darkpurple"
        strokeWidth="5"
      />
      <path
        d="M72 38h8a10 10 0 0 1 0 20h-8"
        className="stroke-darkpurple"
        strokeWidth="5"
      />
    </svg>
  );
}

/**
 * Pick how many coffees: the mug fills with each one, and past five a fresh
 * mug starts on the counter.
 */
export function CoffeeBar() {
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const attribute = useRotatingAttribute();
  const tier = badgeTier(count);

  const checkout = api.donations.createCheckoutSession.useMutation({
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      setLoading(false);
    },
  });

  const choose = (next: number) => {
    setCount(Math.min(MAX_COFFEES, Math.max(1, Math.round(next))));
  };

  const totalMugs = Math.ceil(count / PER_MUG);
  const mugs = Math.min(totalMugs, MAX_MUGS_SHOWN);
  const hiddenMugs = totalMugs - mugs;

  return (
    <div className="bg-yellow text-darkpurple flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl p-6 text-center md:p-10">
      <div>
        <h2 className="mt-2 text-2xl font-black tracking-wide uppercase md:text-3xl">
          Buy me a coffee
        </h2>
        <p className="mt-2 text-sm md:text-base">
          WedgieTracker is one person, all the way from London, UK.
        </p>
        <p className="mt-2 text-sm font-bold md:text-base">
          Keep me awake with your coffees!
        </p>
      </div>

      {/* A mug that fills as the round grows; a fresh one starts past five. */}
      <div className="flex items-end justify-center gap-3" aria-hidden="true">
        {Array.from({ length: mugs }, (_, i) => (
          <Mug
            key={i}
            level={Math.min(1, Math.max(0, (count - i * PER_MUG) / PER_MUG))}
            small={i > 0}
          />
        ))}
        {hiddenMugs > 0 && (
          <span className="bg-darkpurple text-yellow mb-2 rounded-full px-2 py-0.5 text-xs font-black">
            +{hiddenMugs}
          </span>
        )}
      </div>

      {/* Like a player's attribute boosts, rotating. */}
      <p className="text-pink flex h-8 items-center justify-center gap-2 text-sm font-black tracking-wider uppercase">
        <span key={attribute} className="wt-attribute">
          {attribute}
        </span>
        <span
          key={count}
          title={tier.name ? `${tier.name} boost` : undefined}
          className={`wt-bump relative rounded-md px-1.5 py-0.5 tabular-nums ${tier.className}`}
        >
          +{count}
          {tier.sparkle && (
            <span
              className="absolute -top-2 -right-2 text-xs"
              aria-hidden="true"
            >
              ✨
            </span>
          )}
        </span>
      </p>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="How many coffees"
      >
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => choose(n)}
            aria-pressed={count === n}
            className={`size-12 rounded-xl border-2 text-lg font-black transition-all duration-200 ${
              count === n
                ? "border-darkpurple bg-darkpurple text-yellow scale-105"
                : "border-darkpurple/30 hover:border-darkpurple"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <label className="flex w-full max-w-xs flex-col gap-1">
        <span className="sr-only">
          How many coffees, from 1 to {MAX_COFFEES}
        </span>
        <input
          type="range"
          min={1}
          max={MAX_COFFEES}
          step={1}
          value={count}
          onChange={(e) => choose(Number(e.target.value))}
          className="accent-pink h-2 w-full cursor-pointer"
        />
        <span className="text-darkpurple/60 flex justify-between text-xs font-bold">
          <span>1</span>
          <span>{MAX_COFFEES}</span>
        </span>
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          checkout.mutate({ quantity: count });
        }}
        className="bg-pink hover:bg-pink/80 w-full max-w-xs rounded-xl px-6 py-3 text-lg font-black text-white uppercase transition-all disabled:opacity-50"
      >
        {loading
          ? "Pouring…"
          : `Buy ${count === 1 ? "a coffee" : `${count} coffees`} · $${count}`}
      </button>

      <p className="text-darkpurple/60 text-xs">
        $1 a coffee · secure checkout with Stripe
      </p>
    </div>
  );
}
