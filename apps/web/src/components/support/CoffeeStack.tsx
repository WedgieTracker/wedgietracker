"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { CoffeeCup } from "./CoffeeCup";

/** The boosts a round of coffees gives me, like a player's ratings. */
const ATTRIBUTES: { name: string; down?: boolean }[] = [
  { name: "Three-point shot" },
  { name: "Ball handle", down: true },
  { name: "Offensive rebound" },
  { name: "Block" },
  { name: "Steal" },
  { name: "Speed" },
  { name: "Vertical" },
  { name: "Stamina" },
  { name: "Hustle" },
  { name: "Clutch", down: true },
  { name: "Rim stickiness" },
  // Wedgie watching has its costs.
  { name: "Basketball IQ", down: true },
  { name: "Shooting touch", down: true },
  { name: "Rim respect", down: true },
  { name: "Backboard trust", down: true },
  { name: "Sleep", down: true },
  { name: "Shot selection", down: true },
];

const MAX = 99;
const PICKS = [1, 3, 5];
const BOX_W = 300;

/**
 * Cups stack up four high, then sideways. Past that they shrink just enough
 * that every cup still fits the box, up to 99.
 */
function layout(n: number) {
  const boxH = 180;
  let size = 40;
  let high = 4;
  for (size = 40; size >= 9; size -= 1) {
    high = Math.max(1, Math.floor((boxH - size * 0.3) / (size * 1.1)));
    if (Math.ceil(n / high) * (size + 6) <= BOX_W) break;
  }
  if (size === 40) high = Math.min(high, 4);
  return { size, high };
}

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

/** Pick how many coffees: each one drops onto the stack. */
export function CoffeeStack() {
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const attribute = useRotatingAttribute();
  const shown = useRef(3);
  const checkout = api.donations.createCheckoutSession.useMutation({
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      setLoading(false);
    },
  });

  const prev = shown.current;
  shown.current = count;
  const choose = (n: number) => setCount(Math.min(MAX, Math.max(1, n)));
  const { size, high } = layout(count);
  const columns: number[][] = [];
  for (let i = 0; i < count; i++)
    (columns[Math.floor(i / high)] ??= []).push(i);

  return (
    <div className="w-full max-w-xl">
      <div
        role="img"
        aria-label={`${count} ${count === 1 ? "coffee" : "coffees"}`}
        className="bg-badge grain relative h-[250px] overflow-hidden rounded-[22px]"
      >
        <span
          aria-live="polite"
          className="absolute top-4 right-4 flex items-center gap-2 text-right"
        >
          <span
            key={attribute.name}
            className="wt-attr text-cream text-[13px] font-extrabold"
          >
            {attribute.name}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-sm font-black ${
              attribute.down ? "text-night bg-[#ff6fd8]" : "bg-cream text-night"
            }`}
          >
            {attribute.down ? "−" : "+"}
            {count}
          </span>
        </span>
        <div
          className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-end"
          style={{ gap: Math.max(3, Math.round(size / 6)) }}
        >
          {columns.map((col, c) => (
            <div key={c} className="flex flex-col-reverse items-center">
              {col.map((i) => (
                <span
                  key={i}
                  className={`block ${i >= prev ? "wt-cup-drop" : ""}`}
                  style={{
                    width: size,
                    height: Math.round(size * 1.325),
                    marginTop: -Math.round(size * 0.225),
                    animationDelay: `${Math.min(1200, Math.max(0, i - prev) * (count > 12 ? 30 : 90))}ms`,
                  }}
                >
                  <CoffeeCup
                    full
                    steam={i === count - 1}
                    className="size-full"
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label="How many coffees"
        className="my-4 flex flex-wrap justify-center gap-2"
      >
        <button
          type="button"
          onClick={() => choose(count - 1)}
          disabled={count <= 1}
          aria-label="One fewer coffee"
          className="border-cream/35 text-cream hover:border-cream hover:bg-cream/10 focus-visible:outline-cream disabled:hover:border-cream/35 min-h-11 min-w-11 rounded-xl border-2 font-black transition-colors duration-150 focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          −
        </button>
        {PICKS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => choose(n)}
            aria-pressed={count === n}
            className="border-cream/35 text-cream hover:border-cream hover:bg-cream/10 focus-visible:outline-cream disabled:hover:border-cream/35 aria-pressed:bg-cream aria-pressed:border-cream aria-pressed:text-night min-h-11 min-w-11 rounded-xl border-2 px-3 font-black transition-colors duration-150 focus-visible:outline-2 disabled:hover:bg-transparent"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => choose(count + 1)}
          disabled={count >= MAX}
          aria-label="One more coffee"
          className="border-cream/35 text-cream hover:border-cream hover:bg-cream/10 focus-visible:outline-cream disabled:hover:border-cream/35 min-h-11 min-w-11 rounded-xl border-2 font-black transition-colors duration-150 focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          checkout.mutate({ quantity: count });
        }}
        className="btn-sticker w-full text-base disabled:opacity-60"
      >
        {loading
          ? "Opening checkout…"
          : `Buy ${count} ${count === 1 ? "coffee" : "coffees"} · $${count}`}
      </button>
      <p className="text-cream/50 mt-3 text-center text-xs font-bold">
        $1 a coffee · secure checkout
      </p>
    </div>
  );
}
