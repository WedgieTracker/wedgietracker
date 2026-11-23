"use client";

import { useState } from "react";

/*
 * MOCK, for choosing a design: the form that asks a donor for a leaderboard
 * name and the morning recap, after checkout or from the claim email. It saves
 * nothing and sends nothing.
 */

const MAX = 24;

export function CoffeeNameFormMock() {
  const [from, setFrom] = useState<"checkout" | "email">("checkout");
  const [name, setName] = useState("");
  const [recap, setRecap] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <p className="text-5xl" aria-hidden="true">
            ☕
          </p>
          <h1 className="text-cream mt-4 text-4xl font-black uppercase">
            {from === "checkout" ? "Thank you!" : "Claim your coffees"}
          </h1>
          <p className="mt-4 text-xl text-white">
            {from === "checkout"
              ? "Thank you, that one will keep me going through the late games."
              : "Your 3 coffees are on the board as Anonymous. Put your name on them, or leave them anonymous."}
          </p>

          <form
            className="bg-panel border-violet/20 mt-8 flex flex-col gap-4 rounded-[20px] border p-5 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="board-name"
                className="text-cream text-[15px] font-black"
              >
                Your name on the coffee leaderboard
              </label>
              <input
                id="board-name"
                value={name}
                maxLength={MAX}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                placeholder="Anonymous"
                className="border-violet/40 bg-night text-cream placeholder:text-cream/35 focus-visible:outline-cream rounded-xl border-2 px-4 py-3 font-bold focus-visible:outline-2"
              />
              <div className="text-cream/55 flex justify-between gap-3 text-xs font-bold">
                <span>
                  Leave it empty to stay anonymous. Names show once they&apos;re
                  approved.
                </span>
                <span className="tabular-nums">
                  {name.length}/{MAX}
                </span>
              </div>
            </div>

            <label className="text-cream flex items-start gap-3 text-[14px] font-bold">
              <input
                type="checkbox"
                checked={recap}
                onChange={(e) => {
                  setRecap(e.target.checked);
                  setSaved(false);
                }}
                className="accent-violet mt-0.5 size-5 shrink-0"
              />
              <span>
                Send me the morning recap after each wedgie, at 8am Eastern.
                Unsubscribe anytime.
              </span>
            </label>

            <button type="submit" className="btn-sticker text-button-text">
              {name.trim() ? "Put my name on the board" : "Save"}
            </button>
            {saved && (
              <p className="text-cream/70 text-center text-sm font-bold">
                Mock: nothing was saved.
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="fixed right-3 bottom-3 z-50 flex flex-col gap-2 rounded-xl border border-white/20 bg-black/85 p-3 text-xs text-white shadow-lg">
        <span className="font-black uppercase opacity-60">Mock switch</span>
        <div className="flex gap-1">
          {(["checkout", "email"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrom(f)}
              className={`rounded px-2 py-1 font-bold ${from === f ? "bg-white text-black" : "bg-white/10"}`}
            >
              {f === "checkout" ? "After checkout" : "From the claim email"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
