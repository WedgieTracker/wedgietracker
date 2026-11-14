"use client";

import { useNewsletterSubscription } from "~/hooks/use-newsletter";
import { cn } from "~/lib/utils";

export function Newsletter() {
  const { email, setEmail, loading, handleSubmit } =
    useNewsletterSubscription();

  return (
    <section
      aria-labelledby="newsletter-title"
      className={cn(
        "bg-panel border-violet/20 w-full max-w-2xl rounded-[22px] border p-5 md:p-7",
        loading && "pointer-events-none opacity-60",
      )}
    >
      <div>
        <div>
          <h2
            id="newsletter-title"
            className="text-cream text-[21px] leading-tight font-extrabold tracking-[-0.01em]"
          >
            Never miss a wedgie
          </h2>
          <p className="text-cream/70 mt-1 text-sm leading-snug font-bold">
            One short email when a new wedgie lands. Free, and you can
            unsubscribe anytime.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-3 md:flex-row"
        autoComplete="on"
        spellCheck="false"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          autoComplete="email"
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className="bg-night border-violet/40 text-cream placeholder:text-cream/40 focus:border-cream min-h-[54px] flex-1 rounded-2xl border-2 px-4 font-bold outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-sticker px-7 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
    </section>
  );
}
