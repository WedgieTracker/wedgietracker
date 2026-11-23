"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

const MAX = 24;

/**
 * Asks a buyer for their name on the coffee leaderboard, and whether they
 * want the morning recap. From the thanks page it carries the checkout id;
 * from a claim link, the signed claim token. The server checks both with
 * Stripe, and the recap email is the one on the purchase.
 */
export function CoffeeNameForm({
  sessionId,
  claim,
  initialName,
}: {
  sessionId?: string;
  claim?: string;
  initialName: string | null;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [recap, setRecap] = useState(false);
  const save = api.donations.saveBoardName.useMutation();
  const trimmed = name.trim();

  return (
    <form
      className="bg-panel border-violet/20 mt-8 flex flex-col gap-4 rounded-[20px] border p-5 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({ sessionId, claim, name, recap });
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
          autoComplete="nickname"
          onChange={(e) => {
            setName(e.target.value);
            save.reset();
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
          id="board-recap"
          type="checkbox"
          checked={recap}
          onChange={(e) => {
            setRecap(e.target.checked);
            save.reset();
          }}
          className="accent-violet mt-0.5 size-5 shrink-0"
        />
        <span>
          Send me the morning recap after each wedgie, at 8am Eastern.
          Unsubscribe anytime.
        </span>
      </label>

      <button
        type="submit"
        disabled={save.isPending}
        className="btn-sticker text-button-text disabled:opacity-60"
      >
        {save.isPending
          ? "Saving…"
          : trimmed
            ? "Put my name on the board"
            : "Save"}
      </button>

      <p aria-live="polite" className="text-center text-sm font-bold">
        {save.isSuccess && (
          <span className="text-cream/80">
            {trimmed
              ? "Saved. Your name shows on the board once it's approved."
              : "Saved. Your coffees stay anonymous."}
            {save.data.recap === "added" && " You're on the morning recap too."}
            {save.data.recap === "already" &&
              " You were already on the morning recap."}
          </span>
        )}
        {save.isError && (
          <span className="text-[#ff6fd8]">
            Couldn&apos;t save that. Try again in a moment.
          </span>
        )}
      </p>
    </form>
  );
}
